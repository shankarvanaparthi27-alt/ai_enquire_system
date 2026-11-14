import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { withdrawCollegeApplication } from '@/services/applications';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id: applicationId } = await context.params;
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = body?.reason;

    const updated = await withdrawCollegeApplication(applicationId, user.uid, reason);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Application not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/applications/[id]/withdraw error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
