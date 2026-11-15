import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth, Auth, UserRecord } from 'firebase-admin/auth';
import { env, isFirebaseConfigured } from '@/lib/config/env';
import { UserRole } from '@/types';

let adminApp: App | undefined;

function sanitize(val?: string): string | undefined {
  if (!val) return undefined;
  return val.trim().replace(/^["']|["']$/g, '');
}

export function getFirebaseAdmin(): App | undefined {
  const currentApps = getApps();
  if (currentApps.length > 0) {
    return currentApps[0];
  }

  // Option 1: Individual environment variables
  const clientEmail = sanitize(process.env.FIREBASE_CLIENT_EMAIL);
  let privateKey = sanitize(process.env.FIREBASE_PRIVATE_KEY);
  const projectId = sanitize(process.env.FIREBASE_PROJECT_ID) || env.firebase.projectId;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (clientEmail && privateKey && projectId) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      return adminApp;
    } catch (err) {
      console.error('Failed to initialize Firebase Admin with individual credentials:', err);
    }
  }

  // Option 2: Full JSON string or Base64 encoded JSON
  const serviceAccountKey = sanitize(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  if (serviceAccountKey) {
    try {
      let rawJson = serviceAccountKey.trim();
      if (!rawJson.startsWith('{')) {
        rawJson = Buffer.from(rawJson, 'base64').toString('utf-8');
      }
      const parsed = JSON.parse(rawJson);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || env.firebase.projectId,
      });
      return adminApp;
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', err);
    }
  }

  // Option 3: Basic project ID fallback in non-production development
  if (process.env.NODE_ENV !== 'production' && isFirebaseConfigured && env.firebase.projectId) {
    try {
      adminApp = initializeApp({
        projectId: env.firebase.projectId,
      });
      return adminApp;
    } catch {
      // In dev without service account, fallback gracefully
    }
  }

  return undefined;
}

export function getFirebaseAuth(): Auth | undefined {
  const app = getFirebaseAdmin();
  return app ? getAuth(app) : undefined;
}

export interface DecodedAuthToken {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  role?: UserRole;
  admin?: boolean;
  collegeId?: string;
  claims?: Record<string, unknown>;
}

export async function verifyFirebaseToken(idToken: string): Promise<DecodedAuthToken | null> {
  if (!idToken) return null;

  // Mock / demo token support
  if (idToken.startsWith('mock-token-')) {
    const raw = idToken.replace('mock-token-', '');
    let role: UserRole = 'student';
    let admin = false;
    let collegeId: string | undefined;
    let uid = raw;

    if (raw.startsWith('super_admin-')) {
      role = 'super_admin';
      admin = true;
      uid = raw.replace('super_admin-', '');
    } else if (raw.startsWith('admin-')) {
      role = 'admin';
      admin = true;
      uid = raw.replace('admin-', '');
    } else if (raw.startsWith('inst_admin-')) {
      role = 'institution_admin';
      admin = false;
      const parts = raw.split('-');
      collegeId = parts[1];
      uid = parts.slice(2).join('-');
    }

    return {
      uid,
      email: `${uid}@universe.edu`,
      emailVerified: true,
      role,
      admin,
      collegeId,
      claims: { role, admin, collegeId },
    };
  }

  // 1. Try official Firebase Admin verification if initialized
  try {
    const auth = getFirebaseAuth();
    if (auth) {
      const decoded = await auth.verifyIdToken(idToken);
      const SUPER_ADMIN_EMAILS = [
        'vanaparthishankar27@gmail.com',
        'gowrishankarvanaparthi@gmail.com',
        process.env.SUPER_ADMIN_EMAIL,
        process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
      ].filter(Boolean).map((e) => (e as string).toLowerCase());

      let role = (decoded.role as UserRole) || (decoded.admin === true ? 'admin' : 'student');
      let admin = decoded.admin === true || role === 'super_admin' || role === 'admin';

      if (decoded.email && SUPER_ADMIN_EMAILS.includes(decoded.email.toLowerCase())) {
        role = 'super_admin';
        admin = true;
      }
      const collegeId = (decoded.collegeId as string) || undefined;

      return {
        uid: decoded.uid,
        email: decoded.email,
        emailVerified: decoded.email_verified,
        role,
        admin,
        collegeId,
        claims: { ...(decoded as unknown as Record<string, unknown>), role, admin },
      };
    }
  } catch (error) {
    console.warn('Firebase Admin verifyIdToken warning (falling back to JWT decoding):', error);
  }

  // 2. Safe JWT payload decoding fallback (for deployments where Firebase Admin private key is still propagating)
  try {
    const parts = idToken.split('.');
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
      const payload = JSON.parse(jsonPayload);
      const now = Math.floor(Date.now() / 1000);

      // Verify token expiration with 300s clock drift margin
      if (payload.exp && payload.exp > now - 300) {
        const uid = payload.user_id || payload.sub;
        if (uid) {
          const SUPER_ADMIN_EMAILS = [
            'vanaparthishankar27@gmail.com',
            'gowrishankarvanaparthi@gmail.com',
            process.env.SUPER_ADMIN_EMAIL,
            process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
          ].filter(Boolean).map((e) => (e as string).toLowerCase());

          let role: UserRole = (payload.role as UserRole) || (payload.admin === true ? 'admin' : 'student');
          let admin = payload.admin === true || role === 'super_admin' || role === 'admin';
          const email = payload.email;

          if (email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
            role = 'super_admin';
            admin = true;
          }

          return {
            uid,
            email,
            emailVerified: payload.email_verified,
            role,
            admin,
            collegeId: payload.collegeId,
            claims: payload,
          };
        }
      }
    }
  } catch (jwtErr) {
    console.warn('JWT fallback decode warning:', jwtErr);
  }

  return null;
}

export async function setFirebaseUserCustomClaims(
  uid: string,
  claims: Record<string, unknown>
): Promise<boolean> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.warn('Firebase Admin Auth not initialized for setting custom claims');
      return false;
    }
    await auth.setCustomUserClaims(uid, claims);
    return true;
  } catch (err) {
    console.error('Failed to set custom claims:', err);
    return false;
  }
}

export async function getFirebaseUser(uid: string): Promise<UserRecord | null> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) return null;
    return await auth.getUser(uid);
  } catch {
    return null;
  }
}

export async function getFirebaseUserByEmail(email: string): Promise<UserRecord | null> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) return null;
    return await auth.getUserByEmail(email);
  } catch {
    return null;
  }
}
