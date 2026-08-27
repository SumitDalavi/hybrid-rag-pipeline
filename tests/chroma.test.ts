import { getCollection, generateEmbeddings, storeChunksDense, searchDense } from '../src/storage/chroma';

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: [0.1, 0.2] }]
      })
    }
  }));
});

const mockAdd = jest.fn();
const mockQuery = jest.fn();

const mockCollection = {
  add: mockAdd,
  query: mockQuery
};

jest.mock('chromadb', () => {
  return {
    ChromaClient: jest.fn().mockImplementation(() => ({
      getOrCreateCollection: jest.fn().mockImplementation(async ({ name }) => {
        if (name === 'error') throw new Error('Chroma error');
        return mockCollection;
      })
    }))
  };
});

describe('Chroma Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize collection', async () => {
    const col = await getCollection();
    expect(col).toBeDefined();
  });

  it('should generate embeddings', async () => {
    const res = await generateEmbeddings(['test']);
    expect(res).toEqual([[0.1, 0.2]]);
  });

  it('should store chunks', async () => {
    await storeChunksDense([]); // empty case
    expect(mockAdd).not.toHaveBeenCalled();

    await storeChunksDense([
      { id: '1', text: 'hello', metadata: { source: 'x' }, chunkingStrategy: 'fixed', charCount: 5 }
    ]);
    expect(mockAdd).toHaveBeenCalled();
  });

  it('should search chunks', async () => {
    mockQuery.mockResolvedValueOnce({
      ids: [['1']],
      documents: [['hello']],
      metadatas: [[{ source: 'x', chunkingStrategy: 'fixed', charCount: 5 }]],
      distances: [[0.1]]
    });
    const results = await searchDense('hello');
    expect(results).toHaveLength(1);
    expect(results[0].chunk.id).toBe('1');
    expect(results[0].score).toBe(0.9);
  });
  
  it('should search chunks and handle missing data safely', async () => {
    mockQuery.mockResolvedValueOnce({
      ids: [],
      documents: [],
      metadatas: [],
      distances: []
    });
    const results = await searchDense('hello');
    expect(results).toHaveLength(0);
  });
});
