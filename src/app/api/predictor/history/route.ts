import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { PredictorResult } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database service unavailable' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('predictor_results')
      .select('*')
      .eq('user_id', user.uid)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Fetch predictor history error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const history: PredictorResult[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      examName: row.exam_name,
      scoreOrRank: Number(row.score_or_rank),
      category: row.category,
      quota: row.quota,
      targetDegree: row.target_degree,
      targetStream: row.target_stream || undefined,
      class12Percentage:
        row.class_12_percentage != null ? Number(row.class_12_percentage) : undefined,
      predictions: Array.isArray(row.predictions) ? row.predictions : [],
      createdAt: row.created_at,
    }));

    return NextResponse.json({ success: true, data: history });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/predictor/history error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
