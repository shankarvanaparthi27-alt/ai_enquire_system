'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { AdminSidebar, ADMIN_NAV_ITEMS } from '@/components/admin/AdminSidebar';
import { isUserAdmin } from '@/lib/auth/adminCheck';
import { ShieldAlert, ArrowLeft, RefreshCw, GraduationCap, Menu, Sparkles } from 'lucide-react';
import Link from 'next/link';

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isCollapsed, toggleMobileOpen } = useSidebar();
  const pathname = usePathname();

  // Find active navigation item label for the breadcrumb
  const currentNav = ADMIN_NAV_ITEMS.find(
    (item) => pathname === item.href || (item.href !== '/admin/overview' && pathname.startsWith(item.href))
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 text-slate-100 flex relative">
      <AdminSidebar />
      <main
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sleek Sub-Header Bar below the 64px Navbar */}
        <header className="h-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950/75 backdrop-blur-md flex items-center justify-between sticky top-16 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileOpen}
              className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              aria-label="Toggle navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Admin Console</span>
              <span className="text-slate-600">/</span>
              <span className="text-purple-400 font-bold">
                {currentNav?.label || 'Executive Center'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {user?.role || 'Super Admin'}
            </span>
          </div>
        </header>

        {/* Main Admin Page Content Body */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading, refreshUserClaims } = useAuth();

  const isAuthorized = isUserAdmin(user);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      {authLoading ? (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
            Authenticating Administrative Credentials...
          </p>
          <div className="hidden">{children}</div>
        </div>
      ) : !isAuthorized ? (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-black text-white">Administrative Access Required</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your account (<span className="text-slate-200 font-mono">{user?.email || 'Guest'}</span>) is not authorized to access the UniVerse AI Administration Console.
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
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Check Permissions</span>
              </button>
            </div>
          </div>
          <div className="hidden">{children}</div>
        </div>
      ) : (
        <SidebarProvider>
          <AdminShell>{children}</AdminShell>
        </SidebarProvider>
      )}
    </Suspense>
  );
}
