export interface DocumentMetadata {
  source: string;
  heading?: string;
  pageNumber?: number;
  [key: string]: any;
}

export interface Chunk {
  id: string;
  text: string;
  metadata: DocumentMetadata;
  chunkingStrategy: 'fixed' | 'recursive' | 'semantic';
  charCount: number;
}

export interface RetrievalResult {
  chunk: Chunk;
  score: number;
  rank: number;
}

export interface IngestionResponse {
  message: string;
  documentId: string;
  chunksProcessed: number;
}

export interface QueryRequest {
  query: string;
  topK?: number;
}

export interface QueryResponse {
  answer: string;
  citations: Chunk[];
  retrievalLatencyMs: number;
  generationLatencyMs: number;
}
