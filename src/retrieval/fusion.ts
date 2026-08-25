import { Chunk, RetrievalResult } from '../types';
import { searchDense } from '../storage/chroma';
import { bm25Store } from '../storage/bm25';
import { logger } from '../logger';

/**
 * Reciprocal Rank Fusion (RRF)
 * Formula: RRF_score = 1 / (k + rank)
 * where k is a constant (typically 60) and rank is 1-indexed position in the list.
 */
export function reciprocalRankFusion(
  denseResults: { chunk: Chunk, score: number }[],
  sparseResults: { chunk: Chunk, score: number }[],
  k: number = 60,
  topK: number = 5
): RetrievalResult[] {
  const rrfScores = new Map<string, { chunk: Chunk; rrfScore: number }>();

  // Add dense ranks
  denseResults.forEach((result, index) => {
    const rank = index + 1;
    const rrfScore = 1 / (k + rank);
    rrfScores.set(result.chunk.id, { chunk: result.chunk, rrfScore });
  });

  // Add sparse ranks
  sparseResults.forEach((result, index) => {
    const rank = index + 1;
    const rrfScore = 1 / (k + rank);
    
    if (rrfScores.has(result.chunk.id)) {
      const existing = rrfScores.get(result.chunk.id)!;
      existing.rrfScore += rrfScore;
    } else {
      rrfScores.set(result.chunk.id, { chunk: result.chunk, rrfScore });
    }
  });

  // Sort by combined RRF score
  const sorted = Array.from(rrfScores.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK);

  return sorted.map((res, index) => ({
    chunk: res.chunk,
    score: res.rrfScore,
    rank: index + 1,
  }));
}

export async function hybridSearch(query: string, topK: number = 5): Promise<RetrievalResult[]> {
  const startTime = Date.now();
  
  // Run dense and sparse searches concurrently
  const [denseResults, sparseResults] = await Promise.all([
    searchDense(query, topK * 2), // fetch extra for better fusion
    Promise.resolve(bm25Store.search(query, topK * 2)), 
  ]);

  const fused = reciprocalRankFusion(denseResults, sparseResults, 60, topK);
  
  logger.info(`Hybrid search completed in ${Date.now() - startTime}ms`, { 
    query, 
    denseCount: denseResults.length, 
    sparseCount: sparseResults.length, 
    fusedCount: fused.length 
  });
  
  return fused;
}
