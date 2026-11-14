import { NextRequest, NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/serverAuth';
import {
  getInstitutionRepresentatives,
  createInstitutionRepresentative,
} from '@/services/admin/representatives';

export async function GET(req: NextRequest) {
  try {
    const auth = await guardAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const searchParams = req.nextUrl.searchParams;
    const collegeId = searchParams.get('collegeId') || undefined;
    const status = searchParams.get('status') || undefined;

    const reps = await getInstitutionRepresentatives({ collegeId, status });
    return NextResponse.json({ success: true, data: reps });
  } catch (err: unknown) {
    console.error('API /api/admin/representatives GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await guardAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const adminUser = auth.user!;

    const body = await req.json();
    if (!body.userId || !body.collegeId || !body.fullName || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Missing required representative fields (userId, collegeId, fullName, email)' },
        { status: 400 }
      );
    }

    const rep = await createInstitutionRepresentative({
      userId: body.userId,
      collegeId: body.collegeId,
      applicationId: body.applicationId,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      designation: body.designation,
      assignedBy: adminUser.uid,
    });

    return NextResponse.json(
      { success: true, data: rep, message: 'Institution representative activated successfully' },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('API /api/admin/representatives POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
