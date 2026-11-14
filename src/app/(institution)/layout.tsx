'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { InstitutionSidebar } from '@/components/institution/InstitutionSidebar';
import { ShieldAlert, ArrowLeft, RefreshCw, GraduationCap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading, refreshUserClaims } = useAuth();

  const isAuthorized =
    user &&
    (user.role === 'institution_admin' ||
      user.role === 'super_admin' ||
      user.role === 'admin' ||
      user.claims?.role === 'institution_admin');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      {authLoading ? (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Authenticating Institutional Credentials...
          </p>
          <div className="hidden">{children}</div>
        </div>
      ) : !isAuthorized ? (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-black text-white">Representative Access Required</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your account (<span className="text-slate-200 font-mono">{user?.email || 'Guest'}</span>) is not linked to an active institutional liaison appointment.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Student Portal</span>
              </Link>
              <button
                onClick={() => refreshUserClaims()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Status</span>
              </button>
            </div>
          </div>
          <div className="hidden">{children}</div>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex">
          <InstitutionSidebar />
          <main className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
            <header className="h-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Institution Portal
                </span>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-bold transition-all shadow-sm group"
                title="Return to Student Discovery Portal"
              >
                <GraduationCap className="w-4 h-4 text-cyan-400 transition-transform group-hover:scale-110" />
                <span>Student Portal</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </header>

            <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      )}
    </Suspense>
  );
}
