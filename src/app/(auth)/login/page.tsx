'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { isUserAdmin } from '@/lib/auth/adminCheck';

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithEmail, loginWithGoogle, isFirebaseReady } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Role-based redirect if already authenticated
  useEffect(() => {
    if (user) {
      if (user.role === 'super_admin' || user.role === 'admin') {
        router.push('/admin/overview');
      } else if (user.role === 'institution_admin') {
        router.push('/institution-portal');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg(t('auth.errors.required'));
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await loginWithEmail(email.trim(), password);
      showToast({
        type: 'success',
        title: 'Welcome Back!',
        message: 'You have signed in to UniVerse AI.',
      });
      if (isUserAdmin(loggedUser)) {
        router.push('/admin/overview');
      } else if (loggedUser?.role === 'institution_admin' || loggedUser?.claims?.role === 'institution_admin') {
        router.push('/institution-portal');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Email sign-in error:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fErr = err as any;
      const code = fErr?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setErrorMsg(t('auth.errors.invalidCredentials'));
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Too many unsuccessful attempts. Please reset your password or try again in a few minutes.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Network request failed. Please check your internet connection.');
      } else if (fErr?.message) {
        setErrorMsg(fErr.message);
      } else {
        setErrorMsg(t('auth.errors.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const loggedUser = await loginWithGoogle();
      showToast({
        type: 'success',
        title: 'Signed in with Google',
        message: 'Successfully logged in to UniVerse AI.',
      });
      if (isUserAdmin(loggedUser)) {
        router.push('/admin/overview');
      } else if (loggedUser?.role === 'institution_admin' || loggedUser?.claims?.role === 'institution_admin') {
        router.push('/institution-portal');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Google sign-in error:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fErr = err as any;
      const code = fErr?.code || '';
      if (code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        setErrorMsg(
          `Domain "${domain}" is not authorized in Firebase. Please add "${domain}" in Firebase Console → Authentication → Settings → Authorized domains.`
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed before completing authentication. Please try again.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Network request failed. Please check your internet connection.');
      } else if (fErr?.message) {
        setErrorMsg(fErr.message);
      } else {
        setErrorMsg(t('auth.errors.authFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md space-y-6">
        {/* Development Mode Notice if Firebase not yet provided */}
        {!isFirebaseReady && (
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-700 dark:text-cyan-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Development Test Mode Active:</span> Firebase keys in <code className="px-1 py-0.5 rounded bg-cyan-500/20 text-[10px]">.env.local</code> are pending. You can log in with any email (e.g. <span className="font-semibold underline">student@example.edu</span>) to test all features instantly!
            </div>
          </div>
        )}

        {/* Card */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-xl p-6 sm:p-8 backdrop-blur-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('auth.loginTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{t('auth.googleSignIn')}</span>
          </button>

          {/* Divider */}
          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-slate-900 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {t('auth.orDivider')}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('auth.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {t('auth.passwordLabel')}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  {t('auth.forgotPasswordLink')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-cyan-500 focus:ring-cyan-500/50"
                />
                <span>{t('auth.rememberMe')}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-60"
            >
              {loading ? (
                <span>{t('common.loading')}</span>
              ) : (
                <>
                  <span>{t('auth.signInButton')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {t('auth.noAccount')}{' '}
            <Link
              href="/register"
              className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline ml-1"
            >
              {t('nav.register')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
