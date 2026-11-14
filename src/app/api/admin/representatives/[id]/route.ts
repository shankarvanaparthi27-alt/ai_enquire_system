import { NextRequest, NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/serverAuth';
import { updateRepresentativeStatus } from '@/services/admin/representatives';
import { InstitutionRepStatus } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
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
    const status = body.status as InstitutionRepStatus;

    if (!['pending', 'active', 'suspended', 'revoked'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const updated = await updateRepresentativeStatus(id, status, adminUser.uid);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Representative not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/admin/representatives/[id] PATCH error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
