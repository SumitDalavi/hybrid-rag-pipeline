import { hybridSearch, reciprocalRankFusion } from '../src/retrieval/fusion';
import * as chroma from '../src/storage/chroma';
import { bm25Store } from '../src/storage/bm25';
import { Chunk } from '../src/types';

jest.mock('../src/storage/chroma');
jest.mock('../src/storage/bm25');
jest.mock('../src/logger');

describe('Fusion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const dummyChunk1: Chunk = { id: '1', text: 'a', chunkingStrategy: 'fixed', charCount: 1, metadata: { source: '1' } };
  const dummyChunk2: Chunk = { id: '2', text: 'b', chunkingStrategy: 'fixed', charCount: 1, metadata: { source: '1' } };

  it('hybridSearch combines results', async () => {
    (chroma.searchDense as jest.Mock).mockResolvedValue([
      { chunk: dummyChunk1, score: 0.9 }
    ]);
    (bm25Store.search as jest.Mock).mockReturnValue([
      { chunk: dummyChunk2, score: 1.5 }
    ]);

    const results = await hybridSearch('test', 5);
    expect(results).toHaveLength(2);
    // rrf score check
    expect(results[0].rank).toBe(1);
    expect(results[1].rank).toBe(2);
  });

  it('reciprocalRankFusion adds up scores for duplicate items', () => {
    const dense = [{ chunk: dummyChunk1, score: 0.9 }];
    const sparse = [{ chunk: dummyChunk1, score: 1.5 }];
    const results = reciprocalRankFusion(dense, sparse, 60, 5);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBeCloseTo(1/61 + 1/61);
  });
});
