import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import {
  createCollegeApplication,
  getStudentApplications,
} from '@/services/applications';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const applications = await getStudentApplications(user.uid);
    return NextResponse.json({ success: true, data: applications });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/applications GET error:', err);
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
    if (!body.collegeId || !body.applicantName || !body.applicantEmail) {
      return NextResponse.json(
        { success: false, error: 'collegeId, applicantName, and applicantEmail are required' },
        { status: 400 }
      );
    }

    const application = await createCollegeApplication({
      userId: user.uid,
      collegeId: body.collegeId,
      courseId: body.courseId,
      applicantName: body.applicantName,
      applicantEmail: body.applicantEmail,
      applicantPhone: body.applicantPhone,
      category: body.category,
      quota: body.quota,
      examName: body.examName,
      scoreOrRank: body.scoreOrRank ? Number(body.scoreOrRank) : undefined,
      academicYear: body.academicYear,
      statementOfPurpose: body.statementOfPurpose,
      notes: body.notes,
      asDraft: Boolean(body.asDraft),
    });

    return NextResponse.json({ success: true, data: application }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/applications POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
