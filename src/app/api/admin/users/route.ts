import { NextRequest, NextResponse } from 'next/server';
import { guardAdmin, guardSuperAdmin } from '@/lib/auth/serverAuth';
import { getPlatformUsers, assignUserRole } from '@/services/admin/users';
import { UserRole } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const auth = await guardAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get('role') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = Number(searchParams.get('limit') || '50');

    const users = await getPlatformUsers({ role, search, limit });
    return NextResponse.json({ success: true, data: users });
  } catch (err: unknown) {
    console.error('API /api/admin/users GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Only Super Admin can change administrative roles!
    const auth = await guardSuperAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Forbidden: Super Admin authority required to manage roles' },
        { status: auth.status }
      );
    }
    const superAdmin = auth.user!;

    const body = await req.json();
    const targetUid = body.targetUid as string;
    const email = body.email as string;
    const role = body.role as UserRole;
    const collegeId = body.collegeId as string | undefined;

    if (!targetUid || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing targetUid, email or role' },
        { status: 400 }
      );
    }

    if (!['super_admin', 'admin', 'institution_admin', 'student'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
    }

    await assignUserRole({
      targetUid,
      email,
      role,
      collegeId,
      assignedBy: superAdmin.uid,
      assignedByEmail: superAdmin.email,
    });

    return NextResponse.json({
      success: true,
      message: `Role ${role} successfully assigned to ${email}`,
    });
  } catch (err: unknown) {
    console.error('API /api/admin/users PATCH error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
