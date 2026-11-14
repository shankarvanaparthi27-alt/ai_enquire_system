import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { DocVerificationStatus, StudentDocType, StudentDocument } from '@/types';
import { logStudentActivity } from '@/services/activityLogs';

const BUCKET_NAME = 'student-vault';

// In-memory fallback for local development or pending database tables
const inMemoryDocuments = new Map<string, StudentDocument[]>();

export interface UploadDocumentParams {
  userId: string;
  docType: StudentDocType;
  title: string;
  fileName: string;
  fileBuffer: Buffer | Uint8Array;
  fileSizeBytes: number;
  mimeType: string;
  academicYear?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabaseDocument(row: any): StudentDocument {
  return {
    id: row.id,
    userId: row.user_id,
    docType: row.doc_type as StudentDocType,
    title: row.title,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSizeBytes: Number(row.file_size_bytes || 0),
    mimeType: row.mime_type,
    verificationStatus: row.verification_status as DocVerificationStatus,
    rejectionReason: row.rejection_reason || undefined,
    academicYear: row.academic_year || '2026-2027',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function uploadStudentDocument(params: UploadDocumentParams): Promise<StudentDocument> {
  const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sanitizedFileName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${params.userId}/${docId}_${sanitizedFileName}`;
  const now = new Date().toISOString();

  let downloadUrl: string | undefined;

  // 1. Upload file to Supabase Storage private bucket
  const supabase = getSupabaseAdmin() || getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, params.fileBuffer, {
          contentType: params.mimeType,
          upsert: true,
        });

      if (!uploadError) {
        // Generate a 1-hour presigned URL for private access
        const { data: signedData } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(storagePath, 3600);

        if (signedData?.signedUrl) {
          downloadUrl = signedData.signedUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase storage upload error:', err);
    }
  }

  const newDoc: StudentDocument = {
    id: docId,
    userId: params.userId,
    docType: params.docType,
    title: params.title,
    fileName: params.fileName,
    filePath: storagePath,
    fileSizeBytes: params.fileSizeBytes,
    mimeType: params.mimeType,
    verificationStatus: 'uploaded',
    academicYear: params.academicYear || '2026-2027',
    downloadUrl,
    createdAt: now,
    updatedAt: now,
  };

  // 2. Persist metadata into database
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbData, error: dbError } = await supabase
        .from('student_documents')
        .insert({
          user_id: params.userId,
          doc_type: params.docType,
          title: params.title,
          file_name: params.fileName,
          file_path: storagePath,
          file_size_bytes: params.fileSizeBytes,
          mime_type: params.mimeType,
          verification_status: 'uploaded',
          academic_year: params.academicYear || '2026-2027',
        })
        .select()
        .single();

      if (!dbError && dbData) {
        newDoc.id = dbData.id;
      }
    } catch {
      // In-memory fallback
    }
  }

  // 3. Update in-memory cache
  const userDocs = inMemoryDocuments.get(params.userId) || [];
  userDocs.unshift(newDoc);
  inMemoryDocuments.set(params.userId, userDocs);

  // 4. Log student activity
  await logStudentActivity({
    userId: params.userId,
    activityType: 'document_uploaded',
    title: 'Uploaded Document to Vault',
    description: `Uploaded ${params.title} (${(params.fileSizeBytes / 1024).toFixed(1)} KB).`,
    metadata: {
      documentId: newDoc.id,
      docType: params.docType,
      fileName: params.fileName,
    },
  });

  return newDoc;
}

export async function getStudentDocuments(userId: string): Promise<StudentDocument[]> {
  const supabase = getSupabaseAdmin() || getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const docs = data.map(mapDatabaseDocument);

        // Generate signed URLs for private downloads
        for (const doc of docs) {
          try {
            const { data: signedData } = await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(doc.filePath, 3600);
            if (signedData?.signedUrl) {
              doc.downloadUrl = signedData.signedUrl;
            }
          } catch {
            // Ignore signed URL failure
          }
        }
        return docs;
      }
    } catch {
      // Fallback
    }
  }

  return inMemoryDocuments.get(userId) || [];
}

export async function deleteStudentDocument(docId: string, userId: string): Promise<boolean> {
  const docs = await getStudentDocuments(userId);
  const target = docs.find((d) => d.id === docId);
  if (!target) return false;

  const supabase = getSupabaseAdmin() || getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      // Delete from storage
      await supabase.storage.from(BUCKET_NAME).remove([target.filePath]);

      // Delete from DB
      await supabase
        .from('student_documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', userId);
    } catch {
      // Fallback
    }
  }

  // Update in-memory
  const current = inMemoryDocuments.get(userId) || [];
  inMemoryDocuments.set(
    userId,
    current.filter((d) => d.id !== docId)
  );

  // Log activity
  await logStudentActivity({
    userId,
    activityType: 'document_deleted',
    title: 'Removed Document from Vault',
    description: `Deleted ${target.title} from digital locker.`,
    metadata: { documentId: docId, fileName: target.fileName },
  });

  return true;
}
