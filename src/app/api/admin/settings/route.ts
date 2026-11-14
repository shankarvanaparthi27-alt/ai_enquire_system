import { NextRequest, NextResponse } from 'next/server';
import { guardAdmin, guardSuperAdmin } from '@/lib/auth/serverAuth';
import { getPlatformSettings, updatePlatformSettings } from '@/services/admin/settings';

export async function GET(req: NextRequest) {
  try {
    const auth = await guardAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const settings = await getPlatformSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (err: unknown) {
    console.error('API /api/admin/settings GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await guardSuperAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Forbidden: Super Admin authority required' },
        { status: auth.status }
      );
    }
    const superAdmin = auth.user!;

    const body = await req.json();
    const key = body.key as string;
    const value = body.value as Record<string, unknown>;

    if (!key || !value) {
      return NextResponse.json({ success: false, error: 'Missing setting key or value' }, { status: 400 });
    }

    await updatePlatformSettings(key, value, superAdmin.uid);
    return NextResponse.json({ success: true, message: `Setting "${key}" updated successfully` });
  } catch (err: unknown) {
    console.error('API /api/admin/settings PUT error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
