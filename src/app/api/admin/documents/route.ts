import { NextRequest, NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const auth = await guardAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabase = getSupabaseAdmin();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs: any[] = [];

    if (supabase) {
      // 1. Try college_documents
      try {
        const { data: cDocs } = await supabase
          .from('college_documents')
          .select('*, colleges(name, code, city, state)')
          .order('created_at', { ascending: false });

        if (cDocs && cDocs.length > 0) {
          docs.push(...cDocs);
        }
      } catch {
        // Ignore
      }

      // 2. Try student_documents
      try {
        const { data: sDocs } = await supabase
          .from('student_documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (sDocs && sDocs.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          docs.push(...sDocs.map((sd: any) => ({
            id: sd.id,
            college_id: sd.user_id,
            title: sd.title || sd.file_name,
            file_name: sd.file_name,
            file_url: sd.file_path,
            doc_type: sd.doc_type,
            academic_year: sd.academic_year || '2026-2027',
            is_verified: sd.verification_status === 'verified',
            created_at: sd.created_at,
            colleges: {
              name: `Student Dossier (${sd.doc_type})`,
              code: 'STU-DOC',
              city: 'Digital Vault',
              state: 'Encrypted',
            },
          })));
        }
      } catch {
        // Ignore
      }
    }

    return NextResponse.json({ success: true, data: docs });
  } catch (err: unknown) {
    console.error('API /api/admin/documents error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
