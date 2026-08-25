import { ChromaClient, Collection } from 'chromadb';
import OpenAI from 'openai';
import { Chunk } from '../types';
import { logger } from '../logger';
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small';

const chromaClient = new ChromaClient({
  path: process.env.CHROMA_URL ?? 'http://localhost:8000',
});

let collection: Collection | null = null;
const COLLECTION_NAME = 'hybrid_rag_docs';

export async function getCollection(): Promise<Collection> {
  if (!collection) {
    try {
      collection = await chromaClient.getOrCreateCollection({
        name: COLLECTION_NAME,
        metadata: { "hnsw:space": "cosine" }
      });
      logger.info(`ChromaDB collection '${COLLECTION_NAME}' ready.`);
    } catch (error) {
      logger.error('Failed to initialize ChromaDB collection', { error: (error as Error).message });
      throw error;
    }
  }
  return collection;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await getOpenAI().embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts.map(t => t.substring(0, 8000)), // prevent token limits
    });
    return response.data.map(d => d.embedding);
  } catch (error) {
    logger.error('Failed to generate embeddings', { error: (error as Error).message });
    throw error;
  }
}

export async function storeChunksDense(chunks: Chunk[]): Promise<void> {
  if (chunks.length === 0) return;
  const col = await getCollection();
  const texts = chunks.map(c => c.text);
  const embeddings = await generateEmbeddings(texts);
  
  await col.add({
    ids: chunks.map(c => c.id),
    embeddings,
    documents: texts,
    metadatas: chunks.map(c => ({
      ...c.metadata,
      chunkingStrategy: c.chunkingStrategy,
      charCount: c.charCount,
    })),
  });
  logger.debug(`Stored ${chunks.length} chunks in ChromaDB`);
}

export async function searchDense(query: string, topK: number = 5): Promise<{ chunk: Chunk, score: number }[]> {
  const col = await getCollection();
  const [queryEmbedding] = await generateEmbeddings([query]);
  
  const results = await col.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  const matchedChunks: { chunk: Chunk, score: number }[] = [];
  
  if (results.ids[0] && results.documents[0] && results.metadatas[0] && results.distances[0]) {
    for (let i = 0; i < results.ids[0].length; i++) {
      const metadata = results.metadatas[0][i] || {};
      const distArray = results.distances ? results.distances[0] : null;
      const dist = distArray ? distArray[i] : 0;
      matchedChunks.push({
        chunk: {
          id: results.ids[0][i],
          text: results.documents[0][i] as string,
          metadata: { source: metadata.source as string, ...metadata },
          chunkingStrategy: (metadata.chunkingStrategy as 'fixed' | 'recursive' | 'semantic') || 'fixed',
          charCount: (metadata.charCount as number) || 0,
        },
        // Chroma returns distance (lower is better for cosine distance)
        // Score = 1 - distance for similarity (higher is better)
        score: 1 - (dist || 0),
      });
    }
  }

  return matchedChunks;
}
