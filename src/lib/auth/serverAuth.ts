import { NextRequest } from 'next/server';
import { verifyFirebaseToken, DecodedAuthToken } from '@/lib/firebase/admin';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { UserRole } from '@/types';

export interface AuthenticatedUser extends DecodedAuthToken {
  role?: UserRole;
  admin?: boolean;
  collegeId?: string;
}

export async function authenticateRequest(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const decoded = await verifyFirebaseToken(token);
  if (!decoded) return null;

  const SUPER_ADMIN_EMAILS = [
    'vanaparthishankar27@gmail.com',
    'gowrishankarvanaparthi@gmail.com',
    process.env.SUPER_ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
  ].filter(Boolean).map((e) => (e as string).toLowerCase());

  if (decoded.email && SUPER_ADMIN_EMAILS.includes(decoded.email.toLowerCase())) {
    decoded.role = 'super_admin';
    decoded.admin = true;
  }

  // If role is not in token claim yet, check database admin_roles as secondary fallback
  if (!decoded.role || decoded.role === 'student') {
    try {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        const { data: adminRecord } = await supabase
          .from('admin_roles')
          .select('role, college_id, is_active')
          .eq('user_id', decoded.uid)
          .eq('is_active', true)
          .maybeSingle();

        if (adminRecord) {
          decoded.role = adminRecord.role as UserRole;
          decoded.admin = adminRecord.role === 'super_admin' || adminRecord.role === 'admin';
          decoded.collegeId = adminRecord.college_id || undefined;
        }
      }
    } catch {
      // Fallback silently if table not yet provisioned
    }
  }

  return decoded;
}

export interface AuthGuardResult {
  authorized: boolean;
  status: 200 | 401 | 403;
  error?: string;
  user: AuthenticatedUser | null;
}

export async function guardAdmin(req: NextRequest): Promise<AuthGuardResult> {
  const user = await authenticateRequest(req);
  if (!user) {
    return { authorized: false, status: 401, error: 'Unauthorized: Authentication required', user: null };
  }
  if (user.role === 'super_admin' || user.role === 'admin' || user.admin === true) {
    return { authorized: true, status: 200, user };
  }
  return { authorized: false, status: 403, error: 'Forbidden: Administrative privileges required', user };
}

export async function guardSuperAdmin(req: NextRequest): Promise<AuthGuardResult> {
  const user = await authenticateRequest(req);
  if (!user) {
    return { authorized: false, status: 401, error: 'Unauthorized: Authentication required', user: null };
  }
  if (user.role === 'super_admin') {
    return { authorized: true, status: 200, user };
  }
  return { authorized: false, status: 403, error: 'Forbidden: Super Administrator privileges required', user };
}

export async function guardInstitutionAdmin(
  req: NextRequest,
  targetCollegeId?: string
): Promise<AuthGuardResult> {
  const user = await authenticateRequest(req);
  if (!user) {
    return { authorized: false, status: 401, error: 'Unauthorized: Authentication required', user: null };
  }
  if (user.role === 'super_admin' || user.role === 'admin') {
    return { authorized: true, status: 200, user };
  }
  if (user.role === 'institution_admin') {
    if (targetCollegeId && user.collegeId && user.collegeId !== targetCollegeId) {
      return { authorized: false, status: 403, error: 'Forbidden: Unauthorized for this institution', user };
    }
    return { authorized: true, status: 200, user };
  }
  return { authorized: false, status: 403, error: 'Forbidden: Institution Representative credentials required', user };
}

export async function requireAdmin(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  const res = await guardAdmin(req);
  return res.authorized ? res.user : null;
}

export async function requireSuperAdmin(
  req: NextRequest
): Promise<AuthenticatedUser | null> {
  const res = await guardSuperAdmin(req);
  return res.authorized ? res.user : null;
}

export async function requireInstitutionAdmin(
  req: NextRequest,
  targetCollegeId?: string
): Promise<AuthenticatedUser | null> {
  const res = await guardInstitutionAdmin(req, targetCollegeId);
  return res.authorized ? res.user : null;
}
