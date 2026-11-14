import { env, isGeminiConfigured } from '@/lib/config/env';

/**
 * Server-only Google Gemini API Client
 * Uses verified active model: gemini-3.5-flash-lite for reasoning/chat
 * Uses verified active model: gemini-embedding-001 with 768-dim truncation for RAG vectors
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GENERATION_MODEL = 'gemini-3.5-flash-lite';
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
 * Generate a complete non-streaming response from Gemini 3.5 Flash-Lite
 */
export async function generateContent(options: GenerationOptions): Promise<string> {
  const apiKey = getApiKey();
  const url = `${GEMINI_BASE_URL}/models/${GENERATION_MODEL}:generateContent?key=${apiKey}`;

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

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API Error:', response.status, errorText);
    throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response candidate.');
  }

  return text;
}

/**
 * Stream text from Gemini 3.5 Flash-Lite using Server-Sent Events (SSE)
 * Yields text tokens in real time.
 */
export async function* streamContent(
  options: GenerationOptions,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const apiKey = getApiKey();
  const url = `${GEMINI_BASE_URL}/models/${GENERATION_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

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

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: signal || AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini Streaming API Error:', response.status, errorText);
    throw new Error(`Gemini streaming failed with status ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get readable stream from Gemini response.');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
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
    reader.releaseLock();
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
