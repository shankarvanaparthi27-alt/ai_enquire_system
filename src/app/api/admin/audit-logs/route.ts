import { NextRequest, NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/serverAuth';
import { getAdminAuditLogs } from '@/services/admin/audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await guardAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const searchParams = req.nextUrl.searchParams;
    const action = searchParams.get('action') || undefined;
    const targetEntity = searchParams.get('targetEntity') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const limit = Number(searchParams.get('limit') || '50');

    const logs = await getAdminAuditLogs({ action, targetEntity, userId, limit });
    return NextResponse.json({ success: true, data: logs });
  } catch (err: unknown) {
    console.error('API /api/admin/audit-logs GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
