import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { ingestDocument } from '@/services/rag/ingestion';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const collegeId = (formData.get('collegeId') as string) || undefined;
    const academicYear = (formData.get('academicYear') as string) || '2025-2026';

    if (!file || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'File and title are required fields.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await ingestDocument({
      collegeId: collegeId && collegeId !== 'none' ? collegeId : undefined,
      title: title.trim(),
      fileName: file.name,
      fileBuffer: buffer,
      fileType: file.type || 'application/pdf',
      academicYear: academicYear.trim(),
      uploadedBy: user.uid,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      data: {
        documentId: result.documentId,
        chunkCount: result.chunkCount,
        message: 'Document successfully ingested and indexed into knowledge base.',
      },
    });
  } catch (err: unknown) {
    console.error('API /api/ai/ingest error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
