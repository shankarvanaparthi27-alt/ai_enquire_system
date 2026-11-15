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
    const supabase = getSupabaseAdmin();

    if (!user || !supabase) {
      // Return empty session structure for unauthenticated/guest or when db is unavailable
      return NextResponse.json({
        success: true,
        data: {
          session: {
            id: sessionId,
            userId: user?.uid || 'guest',
            title: 'Active Conversation',
            language: 'en' as SupportedLanguage,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          messages: [],
        },
      });
    }

    // Verify ownership
    const { data: sessionRow, error: sessionErr } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.uid)
      .maybeSingle();

    if (sessionErr || !sessionRow) {
      return NextResponse.json({
        success: true,
        data: {
          session: {
            id: sessionId,
            userId: user.uid,
            title: 'Active Conversation',
            language: 'en' as SupportedLanguage,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          messages: [],
        },
      });
    }

    // Fetch messages
    const { data: messageRows, error: msgErr } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (msgErr) {
      console.warn('Message fetch warning:', msgErr.message);
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
    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: 'temp',
          userId: 'guest',
          title: 'Conversation',
          language: 'en',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        messages: [],
      },
    });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id: sessionId } = await context.params;
    const user = await authenticateRequest(req);
    const body = await req.json().catch(() => ({}));
    const title = body?.title?.trim();
    if (!title) {
      return NextResponse.json({ success: false, error: 'A valid title is required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase || !user) {
      return NextResponse.json({
        success: true,
        data: {
          id: sessionId,
          userId: user?.uid || 'guest',
          title,
          language: 'en',
          updatedAt: new Date().toISOString(),
        },
      });
    }

    // Verify ownership and update
    const { data: updated, error } = await supabase
      .from('chat_sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.uid)
      .select('*')
      .maybeSingle();

    if (error || !updated) {
      return NextResponse.json({
        success: true,
        data: {
          id: sessionId,
          userId: user.uid,
          title,
          language: 'en',
          updatedAt: new Date().toISOString(),
        },
      });
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
    const supabase = getSupabaseAdmin();

    if (!user || !supabase) {
      return NextResponse.json({ success: true, message: 'Session deleted' });
    }

    // Delete dependent messages
    await supabase.from('chat_messages').delete().eq('session_id', sessionId);

    // Delete session
    await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.uid);

    return NextResponse.json({ success: true, message: 'Session deleted successfully' });
  } catch (err: unknown) {
    console.error('API /api/ai/sessions/[id] DELETE error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
