import { Chunk } from '../src/types';
import { reciprocalRankFusion } from '../src/retrieval/fusion';
import { BM25Store } from '../src/storage/bm25';

describe('Reciprocal Rank Fusion (RRF)', () => {
  const dummyChunk = (id: string): Chunk => ({
    id,
    text: `Text for ${id}`,
    metadata: { source: 'test' },
    chunkingStrategy: 'fixed',
    charCount: 10,
  });

  test('Combines disjoint sets correctly', () => {
    const dense = [
      { chunk: dummyChunk('A'), score: 0.9 },
      { chunk: dummyChunk('B'), score: 0.8 },
    ];
    const sparse = [
      { chunk: dummyChunk('C'), score: 1.5 },
      { chunk: dummyChunk('D'), score: 1.2 },
    ];

    const fused = reciprocalRankFusion(dense, sparse, 60, 4);
    
    expect(fused.length).toBe(4);
    // Since k=60, rank 1 gives 1/61. All items here appear exactly once.
    // 'A' and 'C' were rank 1 in their respective lists, so they should have highest scores.
    expect(fused[0].score).toBeCloseTo(1 / 61);
    expect(fused[1].score).toBeCloseTo(1 / 61);
    expect(['A', 'C']).toContain(fused[0].chunk.id);
  });

  test('Boosts items appearing in both lists', () => {
    const dense = [
      { chunk: dummyChunk('A'), score: 0.9 },
      { chunk: dummyChunk('B'), score: 0.8 }, // B is rank 2 here
    ];
    const sparse = [
      { chunk: dummyChunk('B'), score: 1.5 }, // B is rank 1 here
      { chunk: dummyChunk('C'), score: 1.2 },
    ];

    const fused = reciprocalRankFusion(dense, sparse, 60, 3);
    
    // B should be boosted because it appears in both lists
    // B RRF = (1/62) + (1/61) = 0.0325
    // A RRF = (1/61) = 0.0163
    // C RRF = (1/62) = 0.0161
    
    expect(fused[0].chunk.id).toBe('B');
    expect(fused[0].score).toBeCloseTo((1 / 62) + (1 / 61));
  });
});

describe('BM25 Store', () => {
  let store: BM25Store;

  beforeEach(() => {
    store = new BM25Store();
  });

  const dummyChunk = (id: string, text: string): Chunk => ({
    id,
    text,
    metadata: { source: 'test' },
    chunkingStrategy: 'fixed',
    charCount: text.length,
  });

  test('Finds exact keyword match', () => {
    store.addChunks([
      dummyChunk('1', 'The quick brown fox jumps over the lazy dog'),
      dummyChunk('2', 'A fast brown fox leaps over a sleepy dog'),
      dummyChunk('3', 'Python is a programming language'),
    ]);

    const results = store.search('Python');
    expect(results.length).toBe(1);
    expect(results[0].chunk.id).toBe('3');
  });

  test('Ranks documents by term frequency', () => {
    store.addChunks([
      dummyChunk('1', 'Machine learning is fascinating. Machine learning is the future.'),
      dummyChunk('2', 'I like machine learning.'),
      dummyChunk('3', 'Apples and oranges.'),
    ]);

    const results = store.search('machine learning');
    
    expect(results.length).toBe(2);
    // Chunk 1 has higher term frequency for both words
    expect(results[0].chunk.id).toBe('1');
    expect(results[1].chunk.id).toBe('2');
  });

  test('Returns empty array for no matches', () => {
    store.addChunks([
      dummyChunk('1', 'Hello world'),
    ]);

    const results = store.search('missing');
    expect(results.length).toBe(0);
  });
});
