import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, guardAdmin } from '@/lib/auth/serverAuth';
import {
  getInstitutionApplications,
  submitInstitutionApplication,
} from '@/services/admin/institutions';

export async function GET(req: NextRequest) {
  try {
    const auth = await guardAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = Number(searchParams.get('limit') || '50');
    const offset = Number(searchParams.get('offset') || '0');

    const result = await getInstitutionApplications({ status, search, limit, offset });
    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (err: unknown) {
    console.error('API /api/admin/institutions GET error:', err);
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
    if (!body.name || !body.code || !body.collegeType || !body.category || !body.state || !body.city || !body.email || !body.phone) {
      return NextResponse.json(
        { success: false, error: 'Missing required institutional dossier fields' },
        { status: 400 }
      );
    }

    const application = await submitInstitutionApplication({
      name: body.name,
      code: body.code,
      collegeType: body.collegeType,
      category: body.category,
      affiliation: body.affiliation,
      establishedYear: body.establishedYear ? Number(body.establishedYear) : undefined,
      state: body.state,
      city: body.city,
      address: body.address,
      website: body.website,
      email: body.email,
      phone: body.phone,
      description: body.description,
      accreditation: body.accreditation,
      nirfRanking: body.nirfRanking ? Number(body.nirfRanking) : undefined,
      logoUrl: body.logoUrl,
      bannerUrl: body.bannerUrl,
      documents: body.documents,
      coursesOffered: body.coursesOffered,
      submittedBy: user.uid,
      status: body.status || 'approved',
    });

    return NextResponse.json(
      { success: true, data: application, message: 'Institution registration dossier submitted successfully' },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error('API /api/admin/institutions POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
