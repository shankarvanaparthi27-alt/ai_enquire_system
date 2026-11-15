'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const { user, loginWithEmail, loginWithGoogle, isFirebaseReady } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Destination resolver
  const navigateToDestination = (currentUser: any) => {
    if (redirectTarget) {
      router.push(redirectTarget);
      return;
    }
    if (isUserAdmin(currentUser)) {
      router.push('/admin/overview');
    } else if (currentUser?.role === 'institution_admin' || currentUser?.claims?.role === 'institution_admin') {
      router.push('/institution-portal');
    } else {
      router.push('/dashboard');
    }
  };

  // Role-based redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigateToDestination(user);
    }
  }, [user]);

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
      navigateToDestination(loggedUser);
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
      navigateToDestination(loggedUser);
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
        {/* Notice if arriving from Chatbot */}
        {redirectTarget === '/chat' && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-indigo-500/15 border border-cyan-500/30 text-xs text-cyan-800 dark:text-cyan-200 flex items-center gap-2.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>
              <strong>Sign In Required:</strong> Please sign in to unlock and start chatting with UniVerse AI.
            </span>
          </div>
        )}

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
              {redirectTarget === '/chat'
                ? 'Sign in to access your personal AI college counselor and chats.'
                : t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Social Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t('auth.continueGoogle')}</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500">
              <span className="bg-white dark:bg-slate-900 px-3">
                {t('auth.orEmail')}
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.edu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('auth.password')}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500/20"
                />
                <span>Remember this session</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:transform-none mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
              href={redirectTarget ? `/register?redirect=${encodeURIComponent(redirectTarget)}` : '/register'}
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
