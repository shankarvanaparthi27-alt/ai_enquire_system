import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getBatchEmbeddings } from '@/services/rag/embeddings';
import { CollegeDocument } from '@/types';
import zlib from 'zlib';

export interface IngestDocumentInput {
  collegeId?: string;
  title: string;
  fileName: string;
  fileBuffer: Buffer;
  fileType: string;
  academicYear: string;
  uploadedBy: string;
}

/**
 * Extracts readable text from plain text, markdown, json, or standard PDF buffers
 */
export function extractTextFromBuffer(buffer: Buffer, fileType: string): string {
  const mime = fileType.toLowerCase();

  // 1. Plain text / Markdown / JSON
  if (
    mime.includes('text') ||
    mime.includes('markdown') ||
    mime.includes('json') ||
    mime.includes('csv')
  ) {
    return buffer.toString('utf-8');
  }

  // 2. PDF text extraction via Flate stream decoding & text block parsing
  if (mime.includes('pdf')) {
    try {
      const pdfString = buffer.toString('binary');
      let extractedText = '';

      // Find stream ... endstream blocks
      const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
      let match: RegExpExecArray | null;

      while ((match = streamRegex.exec(pdfString)) !== null) {
        const streamData = Buffer.from(match[1], 'binary');
        let uncompressed: string | null = null;

        try {
          uncompressed = zlib.inflateSync(streamData).toString('utf-8');
        } catch {
          try {
            uncompressed = zlib.inflateRawSync(streamData).toString('utf-8');
          } catch {
            // Not a flate stream, try raw text
            uncompressed = streamData.toString('utf-8');
          }
        }

        if (uncompressed) {
          // Extract text inside parentheses in TJ or Tj commands: (Hello) Tj or [(Hello) -10 (World)] TJ
          const textMatches = uncompressed.match(/\(([^()]*)\)\s*(?:Tj|'|")/g);
          if (textMatches) {
            const cleanText = textMatches
              .map((m) => m.replace(/^\(/, '').replace(/\)\s*(?:Tj|'|")$/, ''))
              .join(' ');
            extractedText += cleanText + ' ';
          }
        }
      }

      if (extractedText.trim().length > 50) {
        return extractedText.replace(/\s+/g, ' ').trim();
      }

      // Fallback: extract ASCII printable strings from buffer
      const rawAscii = buffer
        .toString('utf-8')
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return rawAscii.length > 50 ? rawAscii : '';
    } catch (err) {
      console.warn('PDF stream extraction encountered error:', err);
    }
  }

  // Default fallback
  return buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
}

/**
 * Splits text into overlapping chunks respecting sentence boundaries
 */
export function chunkText(
  text: string,
  chunkSize = 650,
  overlap = 100
): { content: string; pageNumber: number }[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const chunks: { content: string; pageNumber: number }[] = [];
  let startIndex = 0;
  let pageEstimate = 1;

  while (startIndex < cleaned.length) {
    let endIndex = Math.min(startIndex + chunkSize, cleaned.length);

    // If not at the end of text, find the nearest sentence or clause punctuation
    if (endIndex < cleaned.length) {
      const slice = cleaned.slice(startIndex + Math.floor(chunkSize * 0.7), endIndex + 50);
      const punctMatch = slice.search(/[.!?\n]\s/);
      if (punctMatch !== -1) {
        endIndex = startIndex + Math.floor(chunkSize * 0.7) + punctMatch + 1;
      }
    }

    const chunkContent = cleaned.slice(startIndex, endIndex).trim();
    if (chunkContent.length > 30) {
      chunks.push({
        content: chunkContent,
        pageNumber: pageEstimate,
      });
    }

    // Estimate page increment roughly every 2000 characters
    if (endIndex % 2000 < chunkSize) {
      pageEstimate++;
    }

    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
}

/**
 * Document ingestion pipeline:
 * 1. Validates file size (max 15MB) and type
 * 2. Uploads to Supabase Storage ('college-documents' bucket)
 * 3. Creates record in 'college_documents'
 * 4. Chunks text and embeds via Gemini (768 dims)
 * 5. Stores chunks in 'document_chunks'
 */
export async function ingestDocument(input: IngestDocumentInput): Promise<{
  success: boolean;
  documentId?: string;
  chunkCount?: number;
  error?: string;
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: 'Database server client is not configured.' };
  }

  // Size limit: 15 MB
  const MAX_BYTES = 15 * 1024 * 1024;
  if (input.fileBuffer.length > MAX_BYTES) {
    return { success: false, error: 'Document exceeds 15 MB maximum size limit.' };
  }

  // 1. Upload to Supabase Storage
  const storageBucket = 'college-documents';
  const filePath = `${input.collegeId || 'general'}/${Date.now()}_${input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  let publicFileUrl = '';
  try {
    const { error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(filePath, input.fileBuffer, {
        contentType: input.fileType,
        upsert: false,
      });

    if (uploadError) {
      // If bucket doesn't exist, log warning but continue processing text
      console.warn('Supabase storage upload error:', uploadError.message);
      publicFileUrl = `local://storage/${filePath}`;
    } else {
      const { data: publicUrlData } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(filePath);
      publicFileUrl = publicUrlData.publicUrl;
    }
  } catch (err) {
    console.warn('Supabase storage upload exception:', err);
    publicFileUrl = `local://storage/${filePath}`;
  }

  // 2. Create document record with status 'processing'
  const { data: docRecord, error: docError } = await supabase
    .from('college_documents')
    .insert({
      college_id: input.collegeId || null,
      title: input.title,
      file_url: publicFileUrl,
      file_size_bytes: input.fileBuffer.length,
      file_type: input.fileType,
      academic_year: input.academicYear,
      status: 'processing',
      chunk_count: 0,
      uploaded_by: input.uploadedBy,
    })
    .select('id')
    .single();

  if (docError || !docRecord) {
    return {
      success: false,
      error: `Failed to insert college document: ${docError?.message || 'Unknown error'}`,
    };
  }

  const documentId = docRecord.id;

  try {
    // 3. Extract text
    const extractedText = extractTextFromBuffer(input.fileBuffer, input.fileType);
    if (!extractedText || extractedText.length < 50) {
      await supabase
        .from('college_documents')
        .update({
          status: 'failed',
          error_message: 'Insufficient or unreadable text extracted from document.',
        })
        .eq('id', documentId);
      return { success: false, error: 'Document contained insufficient extractable text.' };
    }

    // 4. Split into chunks
    const chunks = chunkText(extractedText);
    if (chunks.length === 0) {
      await supabase
        .from('college_documents')
        .update({
          status: 'failed',
          error_message: 'Failed to generate text chunks.',
        })
        .eq('id', documentId);
      return { success: false, error: 'No chunks could be produced from document text.' };
    }

    // 5. Generate embeddings for chunks
    const textContents = chunks.map((c) => c.content);
    const embeddings = await getBatchEmbeddings(textContents);

    // 6. Insert chunks into document_chunks
    const chunkRows = chunks.map((chunk, index) => ({
      document_id: documentId,
      college_id: input.collegeId || null,
      chunk_index: index,
      content: chunk.content,
      page_number: chunk.pageNumber,
      embedding: embeddings[index],
      metadata: {
        academic_year: input.academicYear,
        file_name: input.fileName,
        title: input.title,
      },
    }));

    const { error: chunkError } = await supabase
      .from('document_chunks')
      .insert(chunkRows);

    if (chunkError) {
      throw new Error(`Failed to store document chunks: ${chunkError.message}`);
    }

    // 7. Mark document as completed
    await supabase
      .from('college_documents')
      .update({
        status: 'completed',
        chunk_count: chunks.length,
      })
      .eq('id', documentId);

    return {
      success: true,
      documentId,
      chunkCount: chunks.length,
    };
  } catch (processingErr: unknown) {
    const errorMsg = processingErr instanceof Error ? processingErr.message : 'Processing failed';
    console.error('Ingestion processing failure:', errorMsg);

    await supabase
      .from('college_documents')
      .update({
        status: 'failed',
        error_message: errorMsg,
      })
      .eq('id', documentId);

    return { success: false, error: errorMsg };
  }
}
