'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const {
    registerWithEmail,
    loginWithGoogle,
    resendVerificationEmail,
    reloadUser,
    isFirebaseReady,
  } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Post-registration email verification state
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkingVerification, setCheckingVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg(t('auth.errors.required'));
      return;
    }

    if (password.length < 6) {
      setErrorMsg(t('auth.errors.passwordLength'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t('auth.errors.passwordMismatch'));
      return;
    }

    if (!agreedToTerms) {
      setErrorMsg('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(email.trim(), password, fullName.trim());
      setRegisteredEmail(email.trim());
      setRegisteredName(fullName.trim());
      setIsRegistered(true);
      showToast({
        type: 'success',
        title: 'Account Created',
        message: 'Verification email dispatched. Please verify your address.',
      });
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(t('auth.errors.emailInUse'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    setCheckingVerification(true);
    setErrorMsg('');
    try {
      const isVerified = await reloadUser();
      if (isVerified) {
        showToast({
          type: 'success',
          title: 'Email Verified',
          message: `Welcome, ${registeredName || 'Student'}! Your account is active.`,
        });
        router.push('/dashboard');
      } else {
        setErrorMsg(
          'Email not verified yet. Please click the verification link in your email inbox (or spam folder), then click this button again.'
        );
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not verify status. Please try again.');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    setErrorMsg('');
    try {
      await resendVerificationEmail();
      showToast({
        type: 'info',
        title: 'Verification Link Sent',
        message: `A fresh link has been sent to ${registeredEmail}.`,
      });
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to resend verification email. Please try again in a few minutes.');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleRegister = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithGoogle();
      showToast({
        type: 'success',
        title: 'Google Sign-In Successful',
        message: 'Student account connected via Google.',
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setErrorMsg(t('auth.errors.authFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Dedicated Email Verification View shown immediately upon successful registration
  if (isRegistered) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-2xl p-6 sm:p-8 backdrop-blur-md text-center space-y-5 animate-in zoom-in-95 duration-200">
            {/* Animated Mail Icon with Badge */}
            <div className="relative mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/30">
              <Mail className="w-8 h-8" />
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Verify Your Student Email
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                We have dispatched an official verification email to:
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
                <Mail className="w-3.5 h-3.5" />
                <span>{registeredEmail}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-left space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>Next steps to complete registration:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                <li>Check your inbox (or Spam/Junk folder).</li>
                <li>Click the verification link from Firebase / UniVerse AI.</li>
                <li>Return here and click the button below to activate your account.</li>
              </ol>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleCheckVerified}
                disabled={checkingVerification}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-60 cursor-pointer"
              >
                {checkingVerification ? (
                  <span>Checking verification status...</span>
                ) : (
                  <>
                    <span>I Have Verified My Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendEmail}
                disabled={resending || resendCooldown > 0}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all disabled:opacity-50 cursor-pointer"
              >
                {resending
                  ? 'Dispatching email...'
                  : resendCooldown > 0
                  ? `Resend link in ${resendCooldown}s`
                  : 'Resend Verification Link'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline pt-1 block mx-auto cursor-pointer"
              >
                Skip for now & explore dashboard as unverified student
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md space-y-6">
        {/* Development Notice if Firebase keys not yet configured */}
        {!isFirebaseReady && (
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-700 dark:text-cyan-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Development Mode Active:</span> Firebase keys pending in <code className="px-1 py-0.5 rounded bg-cyan-500/20 text-[10px]">.env.local</code>. Instant student registration and local profile sync will simulate seamlessly.
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-xl p-6 sm:p-8 backdrop-blur-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('auth.registerTitle')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('auth.registerSubtitle')}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Quick Button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
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

          <div className="relative my-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <span className="relative px-3 bg-white dark:bg-slate-900 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {t('auth.orDivider')}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('auth.fullNameLabel')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>

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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('auth.passwordLabel')}
              </label>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('auth.confirmPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-cyan-500 focus:ring-cyan-500/50"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal cursor-pointer">
                {t('auth.termsAgreement')}
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
                  <span>{t('auth.signUpButton')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link
              href="/login"
              className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline ml-1"
            >
              {t('nav.login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
