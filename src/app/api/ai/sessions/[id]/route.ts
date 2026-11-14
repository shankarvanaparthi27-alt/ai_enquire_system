import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ChatMessage, ChatSession, SupportedLanguage } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { id: sessionId } = await context.params;
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database service unavailable' }, { status: 503 });
    }

    // Verify ownership
    const { data: sessionRow, error: sessionErr } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.uid)
      .single();

    if (sessionErr || !sessionRow) {
      return NextResponse.json({ success: false, error: 'Session not found or access denied' }, { status: 404 });
    }

    // Fetch messages
    const { data: messageRows, error: msgErr } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (msgErr) {
      return NextResponse.json({ success: false, error: msgErr.message }, { status: 500 });
    }

    const session: ChatSession = {
      id: sessionRow.id,
      userId: sessionRow.user_id,
      title: sessionRow.title,
      language: sessionRow.language as SupportedLanguage,
      createdAt: sessionRow.created_at,
      updatedAt: sessionRow.updated_at,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: ChatMessage[] = (messageRows || []).map((row: any) => ({
      id: row.id,
      sessionId: row.session_id,
      sender: row.sender as 'user' | 'assistant',
      content: row.content,
      language: (row.language as SupportedLanguage) || 'en',
      citations: Array.isArray(row.citations) ? row.citations : undefined,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        session,
        messages,
      },
    });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/ai/sessions/[id] GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id: sessionId } = await context.params;
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database service unavailable' }, { status: 503 });
    }

    const body = await req.json();
    const title = body?.title?.trim();
    if (!title) {
      return NextResponse.json({ success: false, error: 'A valid title is required.' }, { status: 400 });
    }

    // Verify ownership and update
    const { data: updated, error } = await supabase
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.uid)
      .select('*')
      .single();

    if (error || !updated) {
      return NextResponse.json({ success: false, error: 'Session not found or update failed.' }, { status: 404 });
    }

    const session: ChatSession = {
      id: updated.id,
      userId: updated.user_id,
      title: updated.title,
      language: updated.language as SupportedLanguage,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };

    return NextResponse.json({ success: true, data: session });
  } catch (err: unknown) {
    console.error('API /api/ai/sessions/[id] PATCH error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id: sessionId } = await context.params;
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Database service unavailable' }, { status: 503 });
    }

    // Verify ownership before deleting anything
    const { data: sessionRow, error: sessionErr } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.uid)
      .single();

    if (sessionErr || !sessionRow) {
      return NextResponse.json(
        { success: false, error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Delete dependent messages
    await supabase.from('chat_messages').delete().eq('session_id', sessionId);

    // Delete session strictly ensuring user_id match
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.uid);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Session deleted successfully' });
  } catch (err: unknown) {
    console.error('API /api/ai/sessions/[id] DELETE error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
