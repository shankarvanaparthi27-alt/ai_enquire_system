import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/firebase/admin';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const body = await req.json().catch(() => ({}));
    const token = authHeader?.replace('Bearer ', '') || body.idToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication token missing' },
        { status: 401 }
      );
    }

    const verified = await verifyFirebaseToken(token);
    if (!verified) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired Firebase authentication token' },
        { status: 403 }
      );
    }

    // Secondary database check if claims haven't propagated
    if (!verified.role || verified.role === 'student') {
      try {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const { data: adminRecord } = await supabase
            .from('admin_roles')
            .select('role, college_id, is_active')
            .eq('user_id', verified.uid)
            .eq('is_active', true)
            .maybeSingle();

          if (adminRecord) {
            verified.role = adminRecord.role as UserRole;
            verified.admin = adminRecord.role === 'super_admin' || adminRecord.role === 'admin';
            verified.collegeId = adminRecord.college_id || undefined;
          }
        }
      } catch {
        // Fallback silently
      }
    }

    return NextResponse.json({
      success: true,
      user: verified,
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_')) throw error;
    console.error('API token verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server verification error' },
      { status: 500 }
    );
  }
}
