import { NextRequest, NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/serverAuth';
import {
  getInstitutionApplicationById,
  reviewInstitutionApplication,
} from '@/services/admin/institutions';
import { InstitutionApplicationStatus } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const auth = await guardAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const { id } = await context.params;
    const application = await getInstitutionApplicationById(id);
    if (!application) {
      return NextResponse.json({ success: false, error: 'Institution application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: application });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/admin/institutions/[id] GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const auth = await guardAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const adminUser = auth.user!;

    const { id } = await context.params;
    const body = await req.json();
    const status = body.status as InstitutionApplicationStatus;

    if (!['draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid institution status' }, { status: 400 });
    }

    const updated = await reviewInstitutionApplication(id, {
      status,
      reviewNotes: body.reviewNotes,
      rejectionReason: body.rejectionReason,
      reviewerUid: adminUser.uid,
      reviewerEmail: adminUser.email,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Institution application not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Institution application status updated to ${status}`,
    });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/admin/institutions/[id] PATCH error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
