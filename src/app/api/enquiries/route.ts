import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import {
  createStudentEnquiry,
  getStudentEnquiries,
} from '@/services/enquiries';
import { getStudentProfile } from '@/services/profiles';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const enquiries = await getStudentEnquiries(user.uid);
    return NextResponse.json({ success: true, data: enquiries });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/enquiries GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!body.collegeId || !body.subject || !body.initialMessage) {
      return NextResponse.json(
        { success: false, error: 'collegeId, subject, and initialMessage are required' },
        { status: 400 }
      );
    }

    const profile = await getStudentProfile(user.uid);
    const senderName = profile?.fullName || user.email?.split('@')[0] || 'Student Applicant';

    const enquiry = await createStudentEnquiry({
      userId: user.uid,
      collegeId: body.collegeId,
      subject: body.subject,
      category: body.category || 'admissions',
      initialMessage: body.initialMessage,
      priority: body.priority,
      language: body.language,
      senderName,
    });

    return NextResponse.json({ success: true, data: enquiry }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/enquiries POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
