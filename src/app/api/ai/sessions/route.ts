import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ChatSession, SupportedLanguage } from '@/types';

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
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.uid)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Fetch sessions error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessions: ChatSession[] = (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title || 'New Conversation',
      language: (row.language as SupportedLanguage) || 'en',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ success: true, data: sessions });
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith('NEXT_')) throw err;
    console.error('API /api/ai/sessions GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

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
    const title = (body.title || 'New Conversation').trim();
    const language = (body.language as SupportedLanguage) || 'en';

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.uid,
        title,
        language,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Create session error:', error);
      return NextResponse.json({ success: false, error: error?.message || 'Failed to create session' }, { status: 500 });
    }

    const session: ChatSession = {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      language: data.language as SupportedLanguage,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ success: true, data: session }, { status: 201 });
  } catch (err: unknown) {
    console.error('API /api/ai/sessions POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
