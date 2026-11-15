import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ChatSession, SupportedLanguage } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    if (!user) {
      // Return empty sessions for guest/unauthenticated visitors without throwing 401
      return NextResponse.json({ success: true, data: [] });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: true, data: [] });
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.uid)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Fetch sessions query warning:', error.message);
      return NextResponse.json({ success: true, data: [] });
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
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json().catch(() => ({}));
    const title = (body.title || 'New Conversation').trim();
    const language = (body.language as SupportedLanguage) || 'en';

    const effectiveUid = user?.uid || `guest-${Date.now()}`;
    const generatedId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const supabase = getSupabaseAdmin();
    if (!supabase || !user) {
      // In-memory/fallback session for guests or when Supabase is initializing
      const fallbackSession: ChatSession = {
        id: generatedId,
        userId: effectiveUid,
        title,
        language,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, data: fallbackSession }, { status: 201 });
    }

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
      console.warn('Database session insert notice:', error?.message);
      const fallbackSession: ChatSession = {
        id: generatedId,
        userId: user.uid,
        title,
        language,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, data: fallbackSession }, { status: 201 });
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
    return NextResponse.json({
      success: true,
      data: {
        id: `sess-${Date.now()}`,
        userId: 'guest',
        title: 'New Conversation',
        language: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }, { status: 201 });
  }
}
