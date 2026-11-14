'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Users2,
  UserCheck,
  HelpCircle,
  FileCheck2,
  BarChart3,
  History,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  GraduationCap,
} from 'lucide-react';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  superAdminOnly?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: 'Overview', href: '/admin/overview', icon: LayoutDashboard },
  { label: 'Institutions', href: '/admin/institutions', icon: Building2 },
  { label: 'Add Institution', href: '/admin/institutions/new', icon: PlusCircle },
  { label: 'Representatives', href: '/admin/representatives', icon: Users2 },
  { label: 'User Performance', href: '/admin/users', icon: UserCheck, superAdminOnly: true },
  { label: 'Doc Verification', href: '/admin/documents', icon: FileCheck2 },
  { label: 'Analytics & Reports', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Audit Trail', href: '/admin/audit-logs', icon: History },
  { label: 'Platform Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { isCollapsed, toggleCollapsed, isMobileOpen, setMobileOpen } = useSidebar();

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-30 transition-opacity"
        />
      )}

      {/* Main Admin Sidebar Container docked directly under the 64px Navbar */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 flex flex-col bg-slate-950/95 backdrop-blur-md border-r border-slate-800 text-slate-300 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Compact Sidebar Header with Collapse Toggle */}
        <div className="h-12 flex items-center justify-between px-3.5 border-b border-slate-800/80 bg-slate-900/40 shrink-0">
          {!isCollapsed ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-200 truncate">
                Admin Console
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 shrink-0">
                {isSuperAdmin ? 'SUPER' : 'STAFF'}
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
          )}

          {/* Desktop Collapse Button */}
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1 custom-scrollbar">
          {ADMIN_NAV_ITEMS.map((item) => {
            if (item.superAdminOnly && !isSuperAdmin) return null;
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin/overview' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {/* Floating tooltip when collapsed */}
                {isCollapsed && (
                  <span className="hidden group-hover:block absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold border border-slate-700 shadow-xl whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Switcher & Identity Footer */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/80 shrink-0">
          {/* Quick Return to Student Portal Link */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 transition-all group ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
            title="Switch to Student Discovery Portal"
          >
            <GraduationCap className="w-4 h-4 shrink-0 text-cyan-400 transition-transform group-hover:scale-110" />
            {!isCollapsed && <span>Student Portal</span>}
          </Link>

          {/* Theme & Sign Out Controls */}
          <div className={`flex items-center gap-1 pt-1 ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors text-xs font-bold"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>

          {/* User Email/Role Card */}
          {!isCollapsed && (
            <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-500/30">
                {(user?.displayName || user?.email || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-white truncate">
                  {user?.displayName || user?.email?.split('@')[0]}
                </span>
                <span className="text-[9px] text-purple-400 uppercase font-black truncate">
                  {user?.role || 'Super Admin'}
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
