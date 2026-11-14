'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard,
  Building2,
  BookOpen,
  HelpCircle,
  FileUp,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Sun,
  Moon,
  GraduationCap,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Campus Dashboard', href: '/institution-portal', icon: LayoutDashboard },
  { label: 'College Profile', href: '/institution-portal/profile', icon: Building2 },
  { label: 'Courses & Fees', href: '/institution-portal/courses', icon: BookOpen },
  { label: 'Upload Documents', href: '/institution-portal/documents', icon: FileUp },
  { label: 'Campus Analytics', href: '/institution-portal/analytics', icon: BarChart2 },
  { label: 'Settings', href: '/institution-portal/settings', icon: Settings },
];

export function InstitutionSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <>
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md text-white border border-slate-700 shadow-xl"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-slate-950 border-r border-slate-800 text-slate-300 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          <Link
            href="/institution-portal"
            className="flex items-center gap-3 overflow-hidden"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
                  UniVerse AI
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                    CAMPUS
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Representative Portal</span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/60">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && <span>Student Portal</span>}
          </Link>

          <div className="flex items-center justify-between gap-1 pt-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => logout()}
              className="flex items-center gap-2 p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors text-xs font-bold"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
