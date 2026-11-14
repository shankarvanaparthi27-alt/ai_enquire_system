'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  reload,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase/config';
import { AuthUser, StudentProfile } from '@/types';
import { syncStudentProfile, getStudentProfile } from '@/services/profiles';

interface AuthContextType {
  user: AuthUser | null;
  profile: StudentProfile | null;
  loading: boolean;
  isFirebaseReady: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<AuthUser | null>;
  registerWithEmail: (email: string, pass: string, fullName: string) => Promise<void>;
  loginWithGoogle: () => Promise<AuthUser | null>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  resendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<boolean>;
  refreshUserClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isFirebaseReady: false,
  loginWithEmail: async () => null,
  registerWithEmail: async () => {},
  loginWithGoogle: async () => null,
  resetPassword: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
  getIdToken: async () => null,
  resendVerificationEmail: async () => {},
  reloadUser: async () => false,
  refreshUserClaims: async () => {},
});

const MOCK_STORAGE_KEY = 'universe_ai_mock_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync profile from Supabase whenever user changes
  const fetchAndSetProfile = async (authUser: AuthUser) => {
    try {
      const studentProf = await syncStudentProfile({
        firebaseUid: authUser.uid,
        email: authUser.email || '',
        fullName: authUser.displayName || '',
        avatarUrl: authUser.photoURL || undefined,
      });
      setProfile(studentProf);
    } catch (err) {
      console.warn('Failed to sync student profile:', err);
    }
  };

  const resolveUserRoleAndClaims = async (
    fbUser: FirebaseUser
  ): Promise<{ role: any; collegeId?: string; claims?: Record<string, unknown> }> => {
    let role: any = 'student';
    let collegeId: string | undefined;
    let claims: Record<string, unknown> | undefined;
    try {
      // Force refresh so newly assigned server-side claims are immediately recognized
      const tokenResult = await fbUser.getIdTokenResult(true);
      claims = tokenResult.claims;
      role = (tokenResult.claims.role as any) || (tokenResult.claims.admin === true ? 'admin' : 'student');
      collegeId = tokenResult.claims.collegeId as string | undefined;
    } catch (e) {
      console.warn('getIdTokenResult error:', e);
    }

    const SUPER_ADMIN_EMAILS = [
      'vanaparthishankar27@gmail.com',
      'gowrishankarvanaparthi@gmail.com',
      process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
    ].filter(Boolean).map((e) => (e as string).toLowerCase());

    if (fbUser.email && SUPER_ADMIN_EMAILS.includes(fbUser.email.toLowerCase())) {
      role = 'super_admin';
      claims = { ...(claims || {}), role: 'super_admin', admin: true };
    }

    // Secondary database check if custom claims are still propagating
    if (!role || role === 'student') {
      try {
        const idToken = await fbUser.getIdToken(true);
        const res = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });
        const vData = await res.json();
        if (vData.success && vData.user?.role && vData.user.role !== 'student') {
          role = vData.user.role;
          collegeId = vData.user.collegeId || collegeId;
          claims = vData.user.claims || claims;
        }
      } catch (err) {
        console.warn('Verify token fallback error:', err);
      }
    }

    return { role, collegeId, claims };
  };

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const { role, collegeId, claims } = await resolveUserRoleAndClaims(fbUser);

          const authUser: AuthUser = {
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            emailVerified: fbUser.emailVerified,
            role,
            collegeId,
            claims,
          };
          setUser(authUser);
          await fetchAndSetProfile(authUser);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // Check for persisted mock user in dev mode
      try {
        const stored = localStorage.getItem(MOCK_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          setUser(parsed);
          fetchAndSetProfile(parsed);
        }
      } catch {
        // Ignore
      }
      setLoading(false);
    }
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        const { role, collegeId, claims } = await resolveUserRoleAndClaims(cred.user);
        const authUser: AuthUser = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
          photoURL: cred.user.photoURL,
          emailVerified: cred.user.emailVerified,
          role,
          collegeId,
          claims,
        };
        setUser(authUser);
        await fetchAndSetProfile(authUser);
        return authUser;
      } else {
        // Fallback demo student
        const mockUser: AuthUser = {
          uid: 'student-demo-' + Math.abs(email.split('').reduce((a, b) => a + b.charCodeAt(0), 0)),
          email,
          displayName: email.split('@')[0],
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
          emailVerified: true,
        };
        setUser(mockUser);
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
        await fetchAndSetProfile(mockUser);
        return mockUser;
      }
    } finally {
      setLoading(false);
    }
    return null;
  };

  const registerWithEmail = async (email: string, pass: string, fullName: string) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await updateProfile(cred.user, { displayName: fullName });
        await reload(cred.user);
        await sendEmailVerification(cred.user);

        const authUser: AuthUser = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: fullName,
          photoURL: null,
          emailVerified: false,
        };
        setUser(authUser);
        const studentProf = await syncStudentProfile({
          firebaseUid: authUser.uid,
          email: authUser.email || '',
          fullName: fullName,
        });
        setProfile(studentProf);
      } else {
        const mockUser: AuthUser = {
          uid: 'student-' + Date.now(),
          email,
          displayName: fullName,
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
          emailVerified: false,
        };
        setUser(mockUser);
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
        const studentProf = await syncStudentProfile({
          firebaseUid: mockUser.uid,
          email: mockUser.email || '',
          fullName: fullName,
        });
        setProfile(studentProf);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    if (isFirebaseConfigured && auth && auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const reloadUser = async (): Promise<boolean> => {
    if (isFirebaseConfigured && auth && auth.currentUser) {
      await reload(auth.currentUser);
      const fbUser = auth.currentUser;
      const isVerified = fbUser.emailVerified;
      const authUser: AuthUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || user?.displayName || null,
        photoURL: fbUser.photoURL,
        emailVerified: isVerified,
      };
      setUser(authUser);
      return isVerified;
    }
    if (user) {
      const mockVerified: AuthUser = { ...user, emailVerified: true };
      setUser(mockVerified);
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockVerified));
      return true;
    }
    return false;
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        const cred = await signInWithPopup(auth, googleProvider);
        const { role, collegeId, claims } = await resolveUserRoleAndClaims(cred.user);
        const authUser: AuthUser = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName,
          photoURL: cred.user.photoURL,
          emailVerified: cred.user.emailVerified,
          role,
          collegeId,
          claims,
        };
        setUser(authUser);
        await fetchAndSetProfile(authUser);
        return authUser;
      } else {
        const mockUser: AuthUser = {
          uid: 'student-google-' + Date.now(),
          email: 'alex.sharma@gmail.com',
          displayName: 'Alex Sharma',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
          emailVerified: true,
        };
        setUser(mockUser);
        localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockUser));
        await fetchAndSetProfile(mockUser);
        return mockUser;
      }
    } finally {
      setLoading(false);
    }
    return null;
  };

  const resetPassword = async (email: string) => {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      // Simulate successful trigger in mock mode
      await new Promise((res) => setTimeout(res, 600));
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      } else {
        localStorage.removeItem(MOCK_STORAGE_KEY);
      }
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await getStudentProfile(user.uid);
      if (p) setProfile(p);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    if (isFirebaseConfigured && auth?.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    if (user) {
      return `mock-token-${user.uid}`;
    }
    return null;
  };

  const refreshUserClaims = async () => {
    if (isFirebaseConfigured && auth && auth.currentUser) {
      try {
        const { role, collegeId, claims } = await resolveUserRoleAndClaims(auth.currentUser);
        setUser((prev) =>
          prev
            ? {
                ...prev,
                role,
                collegeId,
                claims,
              }
            : null
        );
      } catch (err) {
        console.warn('Failed to refresh user claims:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isFirebaseReady: isFirebaseConfigured,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        resetPassword,
        logout,
        refreshProfile,
        getIdToken,
        resendVerificationEmail,
        reloadUser,
        refreshUserClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
