import { env, isGeminiConfigured } from '@/lib/config/env';

/**
 * Server-only Google Gemini API Client
 * Uses verified active model: gemini-3.5-flash-lite for reasoning/chat
 * Uses verified active model: gemini-embedding-001 with 768-dim truncation for RAG vectors
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const CANDIDATE_GENERATION_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.5-flash',
  'gemini-flash-latest',
];
const EMBEDDING_MODEL = 'gemini-embedding-001';

function getApiKey(): string {
  if (typeof window !== 'undefined') {
    throw new Error('Gemini API key must never be accessed or called on the client side.');
  }

  const key = env.gemini.apiKey;
  if (!key || !isGeminiConfigured) {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
  }
  return key;
}

export interface GeminiMessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface GeminiContent {
  role?: 'user' | 'model';
  parts: GeminiMessagePart[];
}

export interface GenerationOptions {
  contents: GeminiContent[];
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Generate a complete non-streaming response with automatic model fallback
 */
export async function generateContent(options: GenerationOptions): Promise<string> {
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    contents: options.contents,
    generationConfig: {
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  let lastError = '';
  for (const model of CANDIDATE_GENERATION_MODELS) {
    try {
      const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        lastError = await response.text();
        if (response.status === 404 || response.status === 400) {
          // Model not supported on this specific key tier, try next candidate
          continue;
        }
        throw new Error(`Gemini API returned status ${response.status}: ${lastError}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') throw err;
      lastError = (err as Error).message;
    }
  }

  throw new Error(`Gemini generation failed across candidate models: ${lastError}`);
}

/**
 * Stream text from Gemini using Server-Sent Events (SSE) with automatic candidate fallback
 * Yields text tokens in real time.
 */
export async function* streamContent(
  options: GenerationOptions,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const apiKey = getApiKey();

  const body: Record<string, unknown> = {
    contents: options.contents,
    generationConfig: {
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
    },
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  let activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  let lastError = '';

  for (const model of CANDIDATE_GENERATION_MODELS) {
    try {
      const url = `${GEMINI_BASE_URL}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: signal || AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        lastError = await response.text();
        if (response.status === 404 || response.status === 400) {
          // Candidate model not found on key, try next candidate model
          continue;
        }
        throw new Error(`Gemini streaming failed with status ${response.status}: ${lastError}`);
      }

      const reader = response.body?.getReader();
      if (reader) {
        activeReader = reader;
        break;
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') throw err;
      lastError = (err as Error).message;
    }
  }

  if (!activeReader) {
    throw new Error(`Failed to initialize Gemini stream across candidate models: ${lastError}`);
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await activeReader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr) {
            try {
              const data = JSON.parse(jsonStr);
              const textChunk = data?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) {
                yield textChunk;
              }
            } catch {
              // Ignore partial JSON lines
            }
          }
        }
      }
    }
  } finally {
    activeReader.releaseLock();
  }
}

/**
 * Generate 768-dimensional text embedding using gemini-embedding-001
 * Matches Supabase pgvector column vector(768)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = getApiKey();
  const url = `${GEMINI_BASE_URL}/models/${EMBEDDING_MODEL}:embedContent?key=${apiKey}`;

  const cleaned = text.trim().slice(0, 8000);
  if (!cleaned) {
    return new Array(768).fill(0);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: {
        parts: [{ text: cleaned }],
      },
      outputDimensionality: 768,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini Embedding API Error:', response.status, errorText);
    throw new Error(`Gemini embedding failed with status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const vector = data?.embedding?.values;
  if (!vector || !Array.isArray(vector) || vector.length !== 768) {
    throw new Error(
      `Expected 768-dimensional vector from Gemini, got ${vector?.length || 'none'}`
    );
  }

  return vector;
}
