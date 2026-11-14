import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database service unavailable' }, { status: 503 });
    }

    const body = await req.json();
    const { messageId, rating, comment } = body;

    if (!messageId || (rating !== 1 && rating !== -1)) {
      return NextResponse.json(
        { success: false, error: 'Valid messageId and rating (1 or -1) are required.' },
        { status: 400 }
      );
    }

    // Verify target message exists
    const { data: msgRow, error: msgErr } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('id', messageId)
      .single();

    if (msgErr || !msgRow) {
      return NextResponse.json(
        { success: false, error: 'Target message not found' },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from('chat_feedback')
      .insert({
        message_id: messageId,
        user_id: user.uid,
        rating,
        comment: comment?.trim() || null,
      })
      .select('id, rating')
      .single();

    if (error) {
      console.error('Feedback insertion error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    console.error('API /api/ai/feedback error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
