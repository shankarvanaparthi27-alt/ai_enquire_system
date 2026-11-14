import { NextRequest, NextResponse } from 'next/server';
import { getAdmissionDeadlines } from '@/services/deadlines';
import { DeadlineEventType } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examName = searchParams.get('exam') || undefined;
    const eventType = (searchParams.get('type') as DeadlineEventType) || undefined;
    const upcomingOnly = searchParams.get('upcoming') === 'true';

    const deadlines = await getAdmissionDeadlines({
      examName,
      eventType,
      upcomingOnly,
    });

    return NextResponse.json({ success: true, data: deadlines });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/deadlines GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
