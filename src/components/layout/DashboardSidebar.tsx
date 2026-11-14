'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Compass,
  Heart,
  Clock,
  User,
  Bell,
  MessageSquare,
  GitCompare,
  LogOut,
  Bot,
} from 'lucide-react';

export function DashboardSidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { profile, user, logout } = useAuth();

  const links = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/chat', label: 'AI Chatbot', icon: Bot },
    { href: '/colleges', label: t('nav.explore'), icon: Compass },
    { href: '/favourites', label: t('nav.favourites'), icon: Heart },
    { href: '/recently-viewed', label: t('nav.recentlyViewed'), icon: Clock },
    { href: '/profile', label: t('nav.profile'), icon: User },
    { href: '/notifications', label: t('nav.notifications'), icon: Bell },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 min-h-[calc(100vh-4rem)] p-4 transition-colors">
      {/* Student Profile Card in Sidebar */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 mb-6">
        {profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-cyan-500/20"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            {profile?.fullName?.charAt(0) || user?.displayName?.charAt(0) || 'S'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {profile?.fullName || user?.displayName || 'Student'}
          </div>
          <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium truncate">
            {profile?.targetDegree || 'Higher Education'}
          </div>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="space-y-1 flex-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Navigation
        </div>
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-500' : 'text-slate-400'}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}

        {/* Future Phase Indicators (Clearly labelled as per instruction) */}
        <div className="pt-6">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Future Capabilities
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 cursor-not-allowed">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4" />
              <span>AI Chatbot</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold">
              Phase 2
            </span>
          </div>

          <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-slate-800 mt-1.5 cursor-not-allowed">
            <div className="flex items-center gap-2.5">
              <GitCompare className="w-4 h-4" />
              <span>College Compare</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
              Phase 3
            </span>
          </div>
        </div>
      </div>

      {/* Logout button at bottom */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
