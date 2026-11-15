'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { isUserAdmin } from '@/lib/auth/adminCheck';
import {
  Compass,
  LayoutDashboard,
  Heart,
  User,
  LogOut,
  Menu,
  X,
  Sparkles,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isHomepage = pathname === '/';
  const isAdminRoute = pathname.startsWith('/admin');
  const isAdmin = isUserAdmin(user);

  const navLinks = [
    { href: '/', label: t('nav.home'), icon: null },
    { href: '/chat', label: 'AI Chatbot', icon: Sparkles },
    { href: '/colleges', label: t('nav.explore'), icon: Compass },
    ...(user
      ? [
          { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
          { href: '/favourites', label: t('nav.favourites'), icon: Heart },
          ...(isAdmin
            ? [{ href: '/admin/overview', label: 'Admin Portal', icon: ShieldCheck }]
            : []),
          ...(user.role === 'institution_admin'
            ? [{ href: '/institution-portal', label: 'Institution Portal', icon: ShieldCheck }]
            : []),
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className={isAdminRoute ? 'w-full px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  UniVerse<span className="text-cyan-500 dark:text-cyan-400">AI</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Intelligent College Discovery
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Shown only on homepage, sidebar handles app pages) */}
          {isHomepage && (
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right Controls: Language, Theme (on homepage), Auth */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Direct Navbar AI Chatbot Button */}
            <Link
              href={user ? "/chat" : "/login?redirect=/chat"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all shadow-xs group"
              title="Open Universal AI Chatbot"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 group-hover:rotate-12 transition-transform" />
              <span>AI Chatbot</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </Link>

            {isHomepage && (
              <>
                <LanguageSelector />
                <ThemeSelector />
              </>
            )}

            {isAdmin && isAdminRoute && (
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all shadow-xs"
                title="Switch to Student Discovery Portal"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Portal</span>
              </Link>
            )}

            {isAdmin && !isAdminRoute && (
              <Link
                href="/admin/overview"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all focus:outline-none"
                  aria-label="User menu"
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-cyan-500/30"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'S'}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {profile?.fullName || user.displayName || 'Student'}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur-md z-50 p-2 animate-in fade-in zoom-in-95 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {profile?.fullName || user.displayName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-cyan-500" />
                      <span>{t('nav.dashboard')}</span>
                    </Link>

                    <Link
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t('nav.profile')}</span>
                    </Link>

                    <Link
                      href="/favourites"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t('nav.favourites')}</span>
                    </Link>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    {isAdmin && (
                      <Link
                        href="/admin/overview"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold rounded-lg text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-colors mb-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{t('nav.register')}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button & quick AI Chatbot icon */}
          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href={user ? "/chat" : "/login?redirect=/chat"}
              className="p-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-bold flex items-center gap-1"
              title="AI Chatbot"
              aria-label="AI Chatbot"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
              <span className="text-[10px] font-bold">AI Chat</span>
            </Link>

            {isHomepage && (
              <>
                <LanguageSelector variant="compact" />
                <ThemeSelector variant="compact" />
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Open mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            {isAdmin && isAdminRoute && (
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all shadow-xs"
                title="Switch to Student Discovery Portal"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Portal</span>
              </Link>
            )}

            {isAdmin && !isAdminRoute && (
              <Link
                href="/admin/overview"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}

            {user ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <User className="w-4 h-4" />
                  <span>{t('nav.profile')}</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-center text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-center text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
