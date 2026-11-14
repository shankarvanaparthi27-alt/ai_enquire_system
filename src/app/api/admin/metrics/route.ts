import { NextRequest, NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/serverAuth';
import { getAdminMetrics } from '@/services/admin/metrics';

export async function GET(req: NextRequest) {
  try {
    const auth = await guardAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const metrics = await getAdminMetrics();
    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (err: unknown) {
    console.error('API /api/admin/metrics error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
