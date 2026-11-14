import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import {
  deleteStudentDocument,
  getStudentDocuments,
  uploadStudentDocument,
} from '@/services/studentDocs';
import { StudentDocType } from '@/types';

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await getStudentDocuments(user.uid);
    return NextResponse.json({ success: true, data: documents });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/student/documents GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const docType = formData.get('docType') as StudentDocType | null;
    const title = formData.get('title') as string | null;
    const academicYear = (formData.get('academicYear') as string) || '2026-2027';

    if (!file || !docType || !title) {
      return NextResponse.json(
        { success: false, error: 'File, docType, and title are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file format (${file.type}). Only PDF, JPEG, and PNG are accepted.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum allowable limit of 10 MB' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadStudentDocument({
      userId: user.uid,
      docType,
      title,
      fileName: file.name,
      fileBuffer: buffer,
      fileSizeBytes: file.size,
      mimeType: file.type,
      academicYear,
    });

    return NextResponse.json({ success: true, data: uploaded }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/student/documents POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('id');
    if (!docId) {
      return NextResponse.json({ success: false, error: 'Document ID is required' }, { status: 400 });
    }

    const deleted = await deleteStudentDocument(docId, user.uid);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Document not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Document removed from vault' });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/student/documents DELETE error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
