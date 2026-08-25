import { Chunk } from '../types';
import { logger } from '../logger';

interface BM25Params {
  k1?: number;
  b?: number;
}

export class BM25Store {
  private chunks: Map<string, Chunk> = new Map();
  private docTokens: Map<string, string[]> = new Map();
  private df: Map<string, number> = new Map();
  private docCount: number = 0;
  private totalTokenCount: number = 0;
  
  private k1: number;
  private b: number;

  constructor(params: BM25Params = {}) {
    this.k1 = params.k1 ?? 1.5;
    this.b = params.b ?? 0.75;
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase().match(/\b\w+\b/g) || [];
  }

  public addChunks(chunks: Chunk[]): void {
    for (const chunk of chunks) {
      if (this.chunks.has(chunk.id)) continue;

      const tokens = this.tokenize(chunk.text);
      this.chunks.set(chunk.id, chunk);
      this.docTokens.set(chunk.id, tokens);
      
      const uniqueTokens = new Set(tokens);
      for (const token of uniqueTokens) {
        this.df.set(token, (this.df.get(token) || 0) + 1);
      }
      
      this.docCount++;
      this.totalTokenCount += tokens.length;
    }
    logger.debug(`Stored ${chunks.length} chunks in BM25 index. Total: ${this.docCount}`);
  }

  public search(query: string, topK: number = 5): { chunk: Chunk, score: number }[] {
    if (this.docCount === 0) return [];

    const queryTokens = this.tokenize(query);
    const avgDocLength = this.totalTokenCount / this.docCount;
    
    const scores = new Map<string, number>();

    for (const qToken of queryTokens) {
      const docFreq = this.df.get(qToken) || 0;
      if (docFreq === 0) continue;

      // IDF calculation
      const idf = Math.log(1 + (this.docCount - docFreq + 0.5) / (docFreq + 0.5));

      for (const [id, tokens] of this.docTokens.entries()) {
        const tf = tokens.filter(t => t === qToken).length;
        if (tf === 0) continue;

        const docLen = tokens.length;
        const normTf = (tf * (this.k1 + 1)) / (tf + this.k1 * (1 - this.b + this.b * (docLen / avgDocLength)));
        
        scores.set(id, (scores.get(id) || 0) + idf * normTf);
      }
    }

    const results = Array.from(scores.entries())
      .map(([id, score]) => ({ chunk: this.chunks.get(id)!, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  }
}

// Global singleton for BM25 store
export const bm25Store = new BM25Store();
