import { getSupabaseAdmin } from '@/lib/supabase/server';
import {
  getFirebaseUser,
  getFirebaseUserByEmail,
  setFirebaseUserCustomClaims,
} from '@/lib/firebase/admin';
import { logAdminAction } from './audit';

export interface BootstrapResult {
  success: boolean;
  message: string;
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

export async function isBootstrapAllowed(): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('id, user_id, email, is_active')
        .eq('role', 'super_admin')
        .eq('is_active', true)
        .limit(1);

      if (!error && data && data.length > 0) {
        return false; // A Super Admin already exists!
      }
    } catch {
      // Table may not exist yet, allow fallback check
    }
  }

  return true;
}

export async function performSuperAdminBootstrap(
  targetIdentifier: { uid?: string; email?: string },
  executedByIp?: string
): Promise<BootstrapResult> {
  // 1. Verify bootstrap is still allowed (prevent repeated execution)
  const allowed = await isBootstrapAllowed();
  if (!allowed) {
    return {
      success: false,
      message: 'Super Admin bootstrap is disabled because an active Super Admin already exists.',
    };
  }

  // 2. Fetch and verify the Firebase account exists on the server
  let fbUser = null;
  if (targetIdentifier.uid) {
    fbUser = await getFirebaseUser(targetIdentifier.uid);
  }
  if (!fbUser && targetIdentifier.email) {
    fbUser = await getFirebaseUserByEmail(targetIdentifier.email);
  }

  if (!fbUser) {
    return {
      success: false,
      message: `Target user account not found in Firebase Authentication: ${targetIdentifier.email || targetIdentifier.uid}`,
    };
  }

  const uid = fbUser.uid;
  const email = fbUser.email || '';

  // 3. Assign Firebase Custom Claims
  const claimsAssigned = await setFirebaseUserCustomClaims(uid, {
    role: 'super_admin',
    admin: true,
  });

  if (!claimsAssigned) {
    return {
      success: false,
      message: 'Failed to assign custom claims via Firebase Admin SDK. Check service credentials.',
    };
  }

  // 4. Record Super Admin role in Supabase database
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from('admin_roles').upsert({
        user_id: uid,
        email,
        role: 'super_admin',
        assigned_by: 'system_bootstrap',
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('Database admin_roles upsert warning:', err);
    }
  }

  // 5. Write to Immutable Admin Audit Log
  await logAdminAction({
    userId: uid,
    email,
    role: 'super_admin',
    action: 'super_admin_bootstrap',
    targetEntity: 'system',
    targetId: uid,
    newState: { role: 'super_admin', admin: true },
    metadata: {
      bootstrapSource: 'initial_setup',
      userEmail: email,
    },
    ipAddress: executedByIp,
  });

  return {
    success: true,
    message: `Super Admin successfully activated for ${email} (${uid})!`,
    user: {
      uid,
      email,
      role: 'super_admin',
    },
  };
}
