import OpenAI from 'openai';
import { Chunk } from '../types';
import { logger } from '../logger';
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}
const LLM_MODEL = process.env.LLM_MODEL ?? 'gpt-4o-mini';

export async function generateAnswer(query: string, contextChunks: Chunk[]): Promise<string> {
  const startTime = Date.now();
  
  if (contextChunks.length === 0) {
    return "I don't have enough information in the provided documents to answer this question.";
  }

  // Format context for the LLM
  let contextText = "Context Documents:\n\n";
  contextChunks.forEach((chunk, i) => {
    // Include the chunk ID so the LLM can cite it
    contextText += `--- Document Chunk [ID: ${chunk.id}] ---\n`;
    contextText += `Source: ${chunk.metadata.source}\n`;
    contextText += `Text: ${chunk.text}\n\n`;
  });

  const systemPrompt = `You are an expert Q&A assistant for a company's internal documentation. 
Your goal is to answer the user's question accurately based ONLY on the provided context documents.

RULES:
1. Base your answer strictly on the provided context. Do not use outside knowledge.
2. If the context does not contain the answer, say "I cannot answer this based on the provided documents."
3. You MUST provide inline citations for every factual claim you make, referencing the chunk ID.
   Example: "Python was released in 1991 [ID: 1234-abcd]."
4. Synthesize information if it spans multiple chunks.

${contextText}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.2, // low temperature for factual accuracy
    });

    const answer = response.choices[0]?.message?.content || 'No response generated.';
    logger.info(`Answer generated in ${Date.now() - startTime}ms`);
    return answer;
  } catch (error) {
    logger.error('Failed to generate answer', { error: (error as Error).message });
    throw error;
  }
}
