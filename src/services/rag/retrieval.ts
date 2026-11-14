import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getQueryEmbedding } from '@/services/rag/embeddings';
import { ChunkMatchResult, CitationSource } from '@/types';

export interface RetrievalOptions {
  collegeId?: string;
  threshold?: number;
  limit?: number;
}

export interface RetrievedContext {
  chunks: ChunkMatchResult[];
  citations: CitationSource[];
  contextText: string;
}

/**
 * Server-side vector search across verified college knowledge base
 */
export async function retrieveRelevantContext(
  query: string,
  options: RetrievalOptions = {}
): Promise<RetrievedContext> {
  const supabase = getSupabaseAdmin();
  const threshold = options.threshold ?? 0.35;
  const limit = options.limit ?? 5;

  if (!supabase) {
    return { chunks: [], citations: [], contextText: '' };
  }

  try {
    const queryVector = await getQueryEmbedding(query);

    // Call Supabase RPC match_document_chunks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rpcParams: Record<string, any> = {
      query_embedding: queryVector,
      match_threshold: threshold,
      match_count: limit,
    };

    if (options.collegeId) {
      rpcParams.filter_college_id = options.collegeId;
    }

    const { data: matchedRows, error } = await supabase.rpc(
      'match_document_chunks',
      rpcParams
    );

    if (error) {
      console.warn('Vector match RPC failed or returned error:', error.message);
      return { chunks: [], citations: [], contextText: '' };
    }

    if (!matchedRows || matchedRows.length === 0) {
      return { chunks: [], citations: [], contextText: '' };
    }

    // Collect document IDs and college IDs to fetch titles and names
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const documentIds = Array.from(new Set(matchedRows.map((r: any) => r.document_id).filter(Boolean)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collegeIds = Array.from(new Set(matchedRows.map((r: any) => r.college_id).filter(Boolean)));

    // Fetch college names
    const collegeMap = new Map<string, string>();
    if (collegeIds.length > 0) {
      const { data: colleges } = await supabase
        .from('colleges')
        .select('id, name')
        .in('id', collegeIds);
      if (colleges) {
        colleges.forEach((c) => collegeMap.set(c.id, c.name));
      }
    }

    // Fetch document titles and file URLs
    const documentMap = new Map<string, { title: string; fileUrl: string }>();
    if (documentIds.length > 0) {
      const { data: docs } = await supabase
        .from('college_documents')
        .select('id, title, file_url')
        .in('id', documentIds);
      if (docs) {
        docs.forEach((d) =>
          documentMap.set(d.id, { title: d.title, fileUrl: d.file_url })
        );
      }
    }

    // Format results
    const chunks: ChunkMatchResult[] = [];
    const citations: CitationSource[] = [];
    const contextLines: string[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    matchedRows.forEach((row: any, idx: number) => {
      const docMeta = row.document_id ? documentMap.get(row.document_id) : undefined;
      const collegeName = row.college_id ? collegeMap.get(row.college_id) : undefined;

      const chunkResult: ChunkMatchResult = {
        id: row.id,
        documentId: row.document_id,
        collegeId: row.college_id,
        content: row.content || '',
        pageNumber: row.page_number,
        metadata: row.metadata || {},
        similarity: row.similarity || 0,
      };
      chunks.push(chunkResult);

      const citation: CitationSource = {
        documentId: row.document_id,
        documentTitle: docMeta?.title || `Official Brochure #${idx + 1}`,
        collegeId: row.college_id,
        collegeName: collegeName || 'Accredited Institution',
        pageNumber: row.page_number,
        fileUrl: docMeta?.fileUrl,
        snippet: (row.content || '').substring(0, 160) + '...',
      };
      citations.push(citation);

      contextLines.push(
        `[Source ${idx + 1}: ${citation.collegeName} — ${citation.documentTitle}${
          citation.pageNumber ? ` (Page ${citation.pageNumber})` : ''
        }]\n${row.content}\n`
      );
    });

    return {
      chunks,
      citations,
      contextText: contextLines.join('\n---\n'),
    };
  } catch (err) {
    console.error('Error during vector context retrieval:', err);
    return { chunks: [], citations: [], contextText: '' };
  }
}
