import { NextRequest, NextResponse } from 'next/server';
import { isBootstrapAllowed, performSuperAdminBootstrap } from '@/services/admin/bootstrap';

export async function GET() {
  const allowed = await isBootstrapAllowed();
  return NextResponse.json({
    success: true,
    data: {
      bootstrapAllowed: allowed,
      message: allowed
        ? 'Super Admin bootstrap is available. No Super Admin has been established yet.'
        : 'Super Admin bootstrap is locked. An active Super Admin already exists.',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const allowed = await isBootstrapAllowed();
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Bootstrap is disabled. Super Admin already exists.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetEmail = (body.email as string)?.trim() || 'vanaparthishankar27@gmail.com';
    const targetUid = (body.uid as string)?.trim() || undefined;

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    const result = await performSuperAdminBootstrap(
      { uid: targetUid, email: targetEmail },
      ip
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result.user,
    });
  } catch (err: unknown) {
    console.error('Bootstrap API error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error during bootstrap' },
      { status: 500 }
    );
  }
}
