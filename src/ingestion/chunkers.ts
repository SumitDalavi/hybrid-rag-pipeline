import { v4 as uuidv4 } from 'uuid';
import { Chunk, DocumentMetadata } from '../types';
import { RawDocument } from './loaders';

interface ChunkingOptions {
  strategy: 'fixed' | 'recursive' | 'semantic';
  chunkSize?: number;
  overlap?: number;
}

export function chunkDocument(doc: RawDocument, options: ChunkingOptions): Chunk[] {
  switch (options.strategy) {
    case 'fixed':
      return fixedSizeChunking(doc, options.chunkSize ?? 1000, options.overlap ?? 200);
    case 'recursive':
      return recursiveChunking(doc, options.chunkSize ?? 1000, options.overlap ?? 200);
    case 'semantic':
      // Simplified fallback: treats paragraphs as semantic units
      return semanticFallbackChunking(doc, options.chunkSize ?? 1000);
    default:
      return fixedSizeChunking(doc, 1000, 200);
  }
}

function fixedSizeChunking(doc: RawDocument, size: number, overlap: number): Chunk[] {
  const chunks: Chunk[] = [];
  const text = doc.text;
  let i = 0;

  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    const chunkText = text.slice(i, end);
    chunks.push({
      id: uuidv4(),
      text: chunkText,
      metadata: { ...doc.metadata },
      chunkingStrategy: 'fixed',
      charCount: chunkText.length,
    });
    i += size - overlap;
  }
  return chunks;
}

function recursiveChunking(doc: RawDocument, size: number, overlap: number): Chunk[] {
  const chunks: Chunk[] = [];
  
  // Split by double newline (paragraphs/sections) first
  const paragraphs = doc.text.split(/\n\s*\n/);
  
  let currentChunkText = '';

  for (const p of paragraphs) {
    if (currentChunkText.length + p.length > size && currentChunkText.length > 0) {
      chunks.push({
        id: uuidv4(),
        text: currentChunkText.trim(),
        metadata: { ...doc.metadata },
        chunkingStrategy: 'recursive',
        charCount: currentChunkText.trim().length,
      });
      // Start new chunk with overlap from the end of the previous one
      currentChunkText = currentChunkText.slice(Math.max(0, currentChunkText.length - overlap)) + ' ' + p;
    } else {
      currentChunkText += (currentChunkText ? '\n\n' : '') + p;
    }
  }

  if (currentChunkText.trim().length > 0) {
    chunks.push({
      id: uuidv4(),
      text: currentChunkText.trim(),
      metadata: { ...doc.metadata },
      chunkingStrategy: 'recursive',
      charCount: currentChunkText.trim().length,
    });
  }

  return chunks;
}

function semanticFallbackChunking(doc: RawDocument, maxSize: number): Chunk[] {
  // A true semantic chunker would use LLM or embeddings to find topic boundaries.
  // As a fast local approximation, we split by sentences and group them until maxSize.
  const chunks: Chunk[] = [];
  const sentences = doc.text.match(/[^.!?]+[.!?]+/g) || [doc.text];
  
  let currentChunkText = '';
  
  for (const s of sentences) {
    if (currentChunkText.length + s.length > maxSize && currentChunkText.length > 0) {
      chunks.push({
        id: uuidv4(),
        text: currentChunkText.trim(),
        metadata: { ...doc.metadata },
        chunkingStrategy: 'semantic',
        charCount: currentChunkText.trim().length,
      });
      currentChunkText = s;
    } else {
      currentChunkText += (currentChunkText ? ' ' : '') + s.trim();
    }
  }

  if (currentChunkText.trim().length > 0) {
    chunks.push({
      id: uuidv4(),
      text: currentChunkText.trim(),
      metadata: { ...doc.metadata },
      chunkingStrategy: 'semantic',
      charCount: currentChunkText.trim().length,
    });
  }
  
  return chunks;
}
