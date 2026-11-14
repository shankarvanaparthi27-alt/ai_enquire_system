'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase/config';
import { useToast } from '@/contexts/ToastContext';
import {
  GraduationCap,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  const oobCode = searchParams.get('oobCode') || searchParams.get('code') || '';

  const [email, setEmail] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(true);
  const [invalidCode, setInvalidCode] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!oobCode) {
      setVerifyingCode(false);
      setInvalidCode(true);
      return;
    }

    if (isFirebaseConfigured && auth) {
      verifyPasswordResetCode(auth, oobCode)
        .then((userEmail) => {
          setEmail(userEmail);
          setVerifyingCode(false);
        })
        .catch((err) => {
          console.error('Invalid or expired reset code:', err);
          setInvalidCode(true);
          setVerifyingCode(false);
        });
    } else {
      // Mock mode fallback
      setEmail('student@universe.edu');
      setVerifyingCode(false);
    }
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (isFirebaseConfigured && auth && oobCode) {
        await confirmPasswordReset(auth, oobCode, newPassword);
      } else {
        await new Promise((res) => setTimeout(res, 600));
      }

      setSuccess(true);
      showToast({
        type: 'success',
        title: 'Password Updated!',
        message: 'You can now sign in using your new password.',
      });
    } catch (err: unknown) {
      console.error('Password reset confirmation error:', err);
      const code = (err as { code?: string })?.code;
      if (code === 'auth/expired-action-code') {
        setErrorMsg('This password recovery link has expired. Please request a new one.');
      } else if (code === 'auth/invalid-action-code') {
        setErrorMsg('This password recovery link is invalid or has already been used.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password is too weak. Please use a stronger combination.');
      } else {
        setErrorMsg('Failed to update password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifyingCode) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
          Verifying security token...
        </p>
      </div>
    );
  }

  if (invalidCode) {
    return (
      <div className="space-y-5 text-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Invalid or Expired Link
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            This password recovery link is either invalid, expired, or has already been used to set a password.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Request New Link</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-colors"
          >
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-5 text-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Password Changed Successfully!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Your account security credentials have been updated. You can now log in using your email and new password.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-all"
          >
            <span>Sign In Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {email && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
          <span>
            Resetting password for: <strong className="font-mono text-slate-900 dark:text-white">{email}</strong>
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          New Password
        </label>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          Confirm New Password
        </label>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
            className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-60"
      >
        {loading ? (
          <span>Updating password...</span>
        ) : (
          <>
            <span>Save New Password</span>
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
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 shadow-xl p-6 sm:p-8 backdrop-blur-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Create New Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose a secure password to access your account.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="p-8 text-center text-xs text-slate-400">
                Loading security verification...
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
