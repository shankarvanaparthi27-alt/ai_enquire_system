import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { addEnquiryReply } from '@/services/enquiries';
import { getStudentProfile } from '@/services/profiles';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id: enquiryId } = await context.params;
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!body?.message) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty' }, { status: 400 });
    }

    const profile = await getStudentProfile(user.uid);
    const senderName = profile?.fullName || user.email?.split('@')[0] || 'Student Applicant';

    const reply = await addEnquiryReply(enquiryId, user.uid, senderName, body.message, 'student');
    if (!reply) {
      return NextResponse.json({ success: false, error: 'Enquiry not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: reply }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/enquiries/[id]/reply error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
