'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import {
  GraduationCap,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMsg(t('auth.errors.required') || 'Email address is required');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(targetEmail);
      setSubmitted(true);
      showToast({
        type: 'success',
        title: t('auth.resetSentTitle') || 'Recovery Email Dispatched',
        message: t('auth.resetSentDesc') || 'Check your inbox and spam folder for the reset link.',
      });
    } catch (err: unknown) {
      console.error('Password reset request error:', err);
      const code = (err as { code?: string })?.code;
      if (code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (code === 'auth/user-not-found') {
        setErrorMsg('No account found registered with this email address.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Too many recovery attempts. Please wait a few moments and try again.');
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Please check your internet connection.');
      } else {
        setErrorMsg('Unable to dispatch recovery link. Please verify the email and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-xl p-6 sm:p-8 backdrop-blur-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('auth.forgotTitle') || 'Forgot Password'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('auth.forgotSubtitle') || 'Enter your registered email to receive recovery instructions.'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {submitted ? (
            <div className="space-y-5 text-left">
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-800 dark:text-slate-200 space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Recovery Email Dispatched</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  If an account is registered with <strong className="text-slate-900 dark:text-white font-mono">{email}</strong>, a recovery link has been dispatched.
                </p>

                <div className="pt-2 border-t border-emerald-500/20 text-[11px] space-y-1.5 text-slate-500 dark:text-slate-400">
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Check Spam/Junk folder:</strong> Firebase emails may be categorized as Spam or Promotions.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Sender:</strong> <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">noreply@college-enquire-assistant.firebaseapp.com</code></span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Google Sign-In Account?</strong> If you signed up using Google, you don&apos;t need a password — just click <em>Continue with Google</em> on the login page.</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/login"
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 transition-all text-center"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setErrorMsg('');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Another Email</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('auth.emailLabel') || 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder') || 'student@university.edu'}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <p>
                  Did you sign up with Google? You can bypass password recovery and log in directly using <strong className="text-slate-700 dark:text-slate-300">Continue with Google</strong>.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span>{t('common.loading') || 'Sending recovery email...'}</span>
                ) : (
                  <>
                    <span>{t('auth.sendResetLinkButton') || 'Send Recovery Link'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
