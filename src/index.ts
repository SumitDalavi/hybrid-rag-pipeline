import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import fs from 'fs';
import { logger } from './logger';
import { loadDocument } from './ingestion/loaders';
import { chunkDocument } from './ingestion/chunkers';
import { storeChunksDense } from './storage/chroma';
import { bm25Store } from './storage/bm25';
import { hybridSearch } from './retrieval/fusion';
import { generateAnswer } from './generation/generator';
import { QueryRequest, QueryResponse, IngestionResponse } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.use(helmet());
app.use(cors());
app.use(express.json());

// Ensure uploads dir exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /v1/ingest
 * Ingest a document file (pdf, txt, md, html), chunk it, and index it.
 */
app.post('/v1/ingest', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file;
    const strategy = req.body.strategy || 'recursive';
    
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // 1. Load document
    const rawDoc = await loadDocument(file.path, file.originalname);
    
    // 2. Chunk document
    const chunks = chunkDocument(rawDoc, { strategy });
    
    if (chunks.length === 0) {
      res.status(400).json({ error: 'Could not extract any text from the document.' });
      return;
    }

    // 3. Store in Dense (ChromaDB) and Sparse (BM25) indexes concurrently
    await Promise.all([
      storeChunksDense(chunks),
      Promise.resolve(bm25Store.addChunks(chunks))
    ]);

    // Cleanup uploaded file
    fs.unlinkSync(file.path);

    const response: IngestionResponse = {
      message: 'Document successfully ingested and indexed.',
      documentId: file.originalname,
      chunksProcessed: chunks.length,
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Ingestion failed', { error: (error as Error).message });
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Internal server error during ingestion' });
  }
});

/**
 * POST /v1/query
 * Execute a hybrid RAG query.
 */
app.post('/v1/query', async (req: Request, res: Response): Promise<void> => {
  try {
    const body: QueryRequest = req.body;
    
    if (!body.query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const startRetrieval = Date.now();
    
    // 1. Retrieve chunks via hybrid search (RRF)
    const topK = body.topK || 5;
    const retrieved = await hybridSearch(body.query, topK);
    const retrievalLatencyMs = Date.now() - startRetrieval;

    const startGeneration = Date.now();
    
    // 2. Generate answer with LLM
    const chunks = retrieved.map(r => r.chunk);
    const answer = await generateAnswer(body.query, chunks);
    const generationLatencyMs = Date.now() - startGeneration;

    const response: QueryResponse = {
      answer,
      citations: chunks,
      retrievalLatencyMs,
      generationLatencyMs,
    };

    res.json(response);
  } catch (error) {
    logger.error('Query failed', { error: (error as Error).message });
    res.status(500).json({ error: 'Internal server error during query' });
  }
});

app.listen(PORT, () => {
  logger.info(`Hybrid RAG Pipeline running on port ${PORT}`);
});
