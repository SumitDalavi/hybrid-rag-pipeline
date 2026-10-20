import { generateAnswer } from '../src/generation/generator';
import { generateEmbeddings } from '../src/storage/chroma';
import { credentialStatus, isRealOpenAIKey } from '../src/shared/credential-mode';
import { Chunk } from '../src/types';

describe('Progressive Credential Loading in hybrid-rag-pipeline', () => {
  it('detects mock mode when no live OpenAI key is configured', () => {
    expect(credentialStatus.openai).toBe('mock');
    expect(isRealOpenAIKey(undefined)).toBe(false);
    expect(isRealOpenAIKey('sk-dummy')).toBe(false);
  });

  it('generates mock answer gracefully without credentials', async () => {
    const mockChunks: Chunk[] = [
      {
        id: 'chunk-123',
        text: 'Kubernetes pods are the smallest deployable units of computing.',
        chunkingStrategy: 'fixed',
        charCount: 63,
        metadata: { source: 'k8s-docs.md', chunkIndex: 0 },
      },
    ];

    const answer = await generateAnswer('What is a pod?', mockChunks);
    expect(answer).toContain('[Mock Response]');
    expect(answer).toContain('chunk-123');
  });

  it('generates deterministic mock embeddings of 1536 dimensions', async () => {
    const embeddings = await generateEmbeddings(['test query for embedding']);
    expect(embeddings.length).toBe(1);
    expect(embeddings[0].length).toBe(1536);
  });
});
