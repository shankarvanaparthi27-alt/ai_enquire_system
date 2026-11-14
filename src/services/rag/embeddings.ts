import { generateEmbedding } from '@/lib/gemini/client';

/**
 * Generate embedding vector (768-dim) for a single query or text snippet
 */
export async function getQueryEmbedding(query: string): Promise<number[]> {
  const sanitized = query.trim().replace(/\s+/g, ' ');
  if (!sanitized) {
    throw new Error('Cannot generate embedding for an empty query.');
  }
  return await generateEmbedding(sanitized);
}

/**
 * Batch embed text chunks with sequential throttling to respect API rate limits
 */
export async function getBatchEmbeddings(
  chunks: string[],
  delayMs = 150
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const vector = await generateEmbedding(chunk);
    embeddings.push(vector);

    if (i < chunks.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return embeddings;
}
