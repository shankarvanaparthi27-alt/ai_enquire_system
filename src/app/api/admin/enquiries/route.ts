import { NextRequest, NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { mapDatabaseEnquiry } from '@/services/enquiries';

export async function GET(req: NextRequest) {
  try {
    const auth = await guardAdmin(req);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const collegeId = searchParams.get('collegeId');

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        let query = supabase
          .from('student_enquiries')
          .select('*, colleges(*), enquiry_messages(*)')
          .order('created_at', { ascending: false });

        if (status && status !== 'all') query = query.eq('status', status);
        if (collegeId && collegeId !== 'all') query = query.eq('college_id', collegeId);

        const { data, error } = await query;
        if (!error && data) {
          return NextResponse.json({ success: true, data: data.map(mapDatabaseEnquiry) });
        }
      } catch {
        // Fallback
      }
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (err: unknown) {
    console.error('API /api/admin/enquiries error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
