'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard,
  Compass,
  Heart,
  Clock,
  User,
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  GraduationCap,
  Sparkles,
  Layers,
  FileText,
  SlidersHorizontal,
  Bookmark,
  Users,
  LogOut,
  X,
  ExternalLink,
  ChevronRightCircle,
  Sun,
  Moon,
  Laptop,
  Globe,
  Check,
  FileCheck,
  CalendarDays,
  ShieldCheck,
  MessageSquare,
  Award,
  Bot,
} from 'lucide-react';

interface NavItem {
  id?: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasFlyout?: boolean;
  isSubItem?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  collapsible?: boolean;
  items: NavItem[];
}

export function AppSidebar() {
  const pathname = usePathname();
  const { language, setLanguage, languages, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { profile, user, logout } = useAuth();
  const {
    isCollapsed,
    toggleCollapsed,
    isMobileOpen,
    setMobileOpen,
    activeFlyout,
    setActiveFlyout,
  } = useSidebar();

  const [communityExpanded, setCommunityExpanded] = useState(true);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const currentLang = languages.find((l) => l.code === language) || languages[0];

  // Close flyout & language dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
        setActiveFlyout(null);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setActiveFlyout]);

  const navGroups: NavGroup[] = [
    {
      id: 'core',
      label: 'Main Navigation',
      items: [
        { href: '/dashboard', label: t('nav.dashboard') || 'Dashboard', icon: LayoutDashboard },
        { href: '/colleges', label: t('nav.explore') || 'Colleges Directory', icon: Compass, hasFlyout: true },
      ],
    },
    {
      id: 'admissions',
      label: 'Admissions & Vault',
      collapsible: true,
      items: [
        {
          id: 'deadlines',
          href: '/deadlines',
          label: t('nav.deadlines') || 'Deadlines & Events',
          icon: CalendarDays,
          isSubItem: true,
        },
        {
          id: 'document-locker',
          href: '/document-locker',
          label: t('nav.documentLocker') || 'Document Locker',
          icon: ShieldCheck,
          isSubItem: true,
        },
      ],
    },
    {
      id: 'community',
      label: 'Student Community',
      collapsible: true,
      items: [
        {
          id: 'all-colleges',
          href: '/colleges',
          label: 'All Institutions',
          icon: Building2,
          isSubItem: true,
        },
        {
          id: 'favourites',
          href: '/favourites',
          label: t('nav.favourites') || 'My Shortlist',
          icon: Heart,
          isSubItem: true,
        },
        {
          id: 'recently-viewed',
          href: '/recently-viewed',
          label: t('nav.recentlyViewed') || 'Recently Inspected',
          icon: Clock,
          isSubItem: true,
        },
      ],
    },
    {
      id: 'ai-hub',
      label: 'AI Intelligence',
      collapsible: true,
      items: [
        {
          id: 'ai-assistant',
          href: '/chat',
          label: 'AI Chatbot',
          icon: Bot,
          isSubItem: true,
        },
        {
          id: 'ai-counselor',
          href: '/ai-counselor',
          label: 'AI College Counselor',
          icon: Sparkles,
          isSubItem: true,
        },
        {
          id: 'compare',
          href: '/compare',
          label: 'College Comparison',
          icon: Layers,
          isSubItem: true,
        },
        {
          id: 'predictor',
          href: '/predictor',
          label: 'Admission Predictor',
          icon: GraduationCap,
          isSubItem: true,
        },
      ],
    },
    {
      id: 'student-tools',
      label: 'Student Center',
      items: [
        { href: '/profile', label: t('nav.profile') || 'Student Profile', icon: User },
        { href: '/notifications', label: t('nav.notifications') || 'Notifications', icon: Bell },
      ],
    },
    ...(user?.role === 'super_admin' || user?.role === 'admin' || user?.claims?.admin === true
      ? [
          {
            id: 'admin_nav',
            label: 'Administration Console',
            items: [
              {
                id: 'admin_portal',
                href: '/admin/overview',
                label: 'Admin Portal',
                icon: ShieldCheck,
              },
            ],
          },
        ]
      : []),
    ...(user?.role === 'institution_admin'
      ? [
          {
            id: 'inst_nav',
            label: 'Institutional Console',
            items: [
              {
                id: 'institution_portal',
                href: '/institution-portal',
                label: 'Campus Portal',
                icon: Building2,
              },
            ],
          },
        ]
      : []),
  ];

  const flyoutItems = [
    { title: 'Top NIRF Ranked 2026', href: '/colleges?sortBy=nirf' },
    { title: 'Government Universities', href: '/colleges?category=Government' },
    { title: 'Autonomous & Private Hubs', href: '/colleges?category=Private' },
    { title: 'Engineering & Technology', href: '/colleges?collegeType=Engineering%20%26%20Technology' },
    { title: 'Medical & Health Sciences', href: '/colleges?collegeType=Medical%20%26%20Health%20Sciences' },
    { title: 'Management & Business', href: '/colleges?collegeType=Management%20%26%20Business' },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] shrink-0 transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pt-3 px-3 pb-0 flex flex-col ${
          isMobileOpen
            ? 'translate-x-0 w-72 bg-white dark:bg-slate-900 shadow-2xl'
            : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-[272px]'}`}
      >
        {/* Full-Height Card Container stretching to the bottom edge */}
        <div className="relative flex-1 flex flex-col rounded-t-3xl rounded-b-none border-t border-x border-b-0 border-slate-200/90 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/50 backdrop-blur-xl overflow-visible p-3 pb-4 transition-colors">
          {/* FANCY COLLAPSE / EXPAND TOGGLE BUTTON (Floating on top-right edge) */}
          <div className="hidden lg:block absolute -right-3.5 top-6 z-50">
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="group relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-110 active:scale-95 transition-all cursor-pointer p-0.5"
            >
              <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-200 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
                <ChevronLeft
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${
                    isCollapsed ? 'rotate-180' : ''
                  }`}
                />
              </div>
              {/* Subtle animated pulse indicator */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </button>
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden absolute top-3 right-3 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Header Logo */}
          <div className="flex items-center gap-3 px-1.5 py-1 mb-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0 shadow-sm shadow-cyan-500/10">
              <GraduationCap className="w-5 h-5 text-cyan-500" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 overflow-hidden animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
                    UniVerse<span className="text-cyan-500 dark:text-cyan-400">AI</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    Pro
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Higher Education Portal
                </div>
              </div>
            )}
          </div>

          {/* Workspace / Student Organization Badge (Matching Screenshot's Purple Card) */}
          <div
            className={`flex items-center gap-2.5 p-2 rounded-2xl border transition-all mb-4 ${
              isCollapsed
                ? 'justify-center bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400'
                : 'bg-purple-500/5 dark:bg-purple-950/20 border-purple-500/15 text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm shadow-purple-600/20">
              {profile?.fullName?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {profile?.fullName || user?.displayName || 'Student Registry'}
                  </div>
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium truncate">
                    {profile?.targetDegree || 'Undergraduate Registry'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </>
            )}
          </div>

          {/* Scrollable Navigation List */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-0.5 custom-scrollbar">
            {/* Core Links */}
            <div className="space-y-1">
              {navGroups[0].items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <div key={item.href} className="relative">
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs transition-all ${
                        isActive
                          ? 'bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
                      } ${isCollapsed ? 'justify-center px-0' : ''}`}
                    >
                      {/* Active indicator line on the left (matching the reference image) */}
                      {isActive && (
                        <div className="absolute left-1.5 w-1 h-5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50" />
                      )}
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-cyan-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {!isCollapsed && item.hasFlyout && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveFlyout(activeFlyout === 'colleges' ? null : 'colleges');
                          }}
                          className="p-1 rounded-lg hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Collapsible Group: Student Community & Registry */}
            <div className="space-y-1">
              {!isCollapsed && (
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Community & Registry
                  </span>
                  <button
                    type="button"
                    onClick={() => setCommunityExpanded(!communityExpanded)}
                    className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        communityExpanded ? '' : '-rotate-90'
                      }`}
                    />
                  </button>
                </div>
              )}

              {/* Collapsed icon divider */}
              {isCollapsed && (
                <div className="w-8 h-[1px] bg-slate-200 dark:border-slate-800 mx-auto my-1" />
              )}

              {(communityExpanded || isCollapsed) && (
                <div className="space-y-1">
                  {navGroups[1].items.map((subItem) => {
                    const isActive = pathname === subItem.href;
                    const Icon = subItem.icon;
                    return (
                      <Link
                        key={subItem.id || subItem.href}
                        href={subItem.href}
                        onClick={() => setMobileOpen(false)}
                        className={`group relative flex items-center gap-3 px-3 py-2 rounded-2xl text-xs transition-all ${
                          isActive
                            ? 'bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
                        } ${isCollapsed ? 'justify-center px-0 py-2.5' : 'pl-4'}`}
                      >
                        {/* Reference Image: Vertical Blue Line Indicator */}
                        {isActive && (
                          <div className="absolute left-1.5 w-1 h-5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50" />
                        )}
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-cyan-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate flex-1">{subItem.label}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Student Center / Preferences */}
            <div className="space-y-1 pt-1">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Student Tools
                </div>
              )}
              {navGroups[2].items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    {isActive && (
                      <div className="absolute left-1.5 w-1 h-5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50" />
                    )}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-cyan-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Appearance & Language Preferences in Sidebar */}
          {!isCollapsed ? (
            <div className="pt-2 pb-1 space-y-2.5 border-t border-slate-200/80 dark:border-slate-800/80">
              {/* Appearance / Dark Theme Mode */}
              <div>
                <div className="flex items-center justify-between px-1 mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Appearance
                  </span>
                  <span className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 capitalize">
                    {theme}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all ${
                      theme === 'light'
                        ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Light Theme"
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all ${
                      theme === 'dark'
                        ? 'bg-white dark:bg-slate-900 text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Dark Theme"
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] font-semibold transition-all ${
                      theme === 'system'
                        ? 'bg-white dark:bg-slate-900 text-cyan-500 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="System Default Theme"
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Auto</span>
                  </button>
                </div>
              </div>

              {/* Language Mode Selector */}
              <div ref={langDropdownRef}>
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Language
                  </span>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <span className="shrink-0">{currentLang?.flag}</span>
                      <span className="truncate">{currentLang?.nativeName}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
                        langDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {langDropdownOpen && (
                    <div className="absolute bottom-full left-0 right-0 mb-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-48 overflow-y-auto custom-scrollbar">
                      {languages.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => {
                            setLanguage(l.code);
                            setLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                            l.code === language
                              ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{l.flag}</span>
                            <span>{l.nativeName}</span>
                          </span>
                          {l.code === language && (
                            <Check className="w-3.5 h-3.5 text-cyan-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Collapsed Rail Theme & Language Icon Buttons */
            <div className="pt-2 pb-1 space-y-2 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center">
              {/* Quick Theme Cycle Button */}
              <button
                type="button"
                onClick={() => {
                  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
                  setTheme(nextTheme);
                }}
                title={`Theme: ${theme} (Click to switch)`}
                className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors"
              >
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-400" />
                ) : theme === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Laptop className="w-4 h-4 text-cyan-500" />
                )}
              </button>

              {/* Language Button with Popover */}
              <div className="relative" ref={langDropdownRef}>
                <button
                  type="button"
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  title={`Language: ${currentLang?.nativeName}`}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors text-sm"
                >
                  <span>{currentLang?.flag || '🌐'}</span>
                </button>

                {langDropdownOpen && (
                  <div className="absolute left-full bottom-0 ml-2 w-44 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      Languages
                    </div>
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLanguage(l.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                          l.code === language
                            ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{l.flag}</span>
                          <span>{l.nativeName}</span>
                        </span>
                        {l.code === language && (
                          <Check className="w-3.5 h-3.5 text-cyan-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer User & Sign-out */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
            {user ? (
              <button
                type="button"
                onClick={() => logout()}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{t('nav.logout') || 'Sign Out'}</span>}
              </button>
            ) : (
              <Link
                href="/login"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 transition-colors ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span>{t('nav.login') || 'Sign In'}</span>}
              </Link>
            )}
          </div>
        </div>

        {/* FLOATING SUBMENU FLYOUT PANEL (Matching the 3rd card in reference image) */}
        {activeFlyout === 'colleges' && (
          <div
            ref={flyoutRef}
            className="absolute left-full top-16 ml-3 z-50 w-64 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xl p-4 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
          >
            {/* Flyout Header with Blue Pill */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
                <span>Directory Shortcuts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
              <button
                type="button"
                onClick={() => setActiveFlyout(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filter Quick Links */}
            <div className="space-y-1">
              {flyoutItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setActiveFlyout(null)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <span className="text-slate-400 group-hover:text-cyan-500 transition-colors">•</span>
                  <span className="truncate flex-1">{item.title}</span>
                </Link>
              ))}
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/colleges"
                onClick={() => setActiveFlyout(null)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                <span>View Full Catalog</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </aside>

      {/* MOBILE FLOATING ACTION BUTTON (Visible only on mobile/tablet to open the navbar) */}
      <div className="lg:hidden fixed bottom-6 left-6 z-50">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 p-3.5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/35 hover:scale-105 active:scale-95 transition-all"
          aria-label="Open mobile navigation"
        >
          <Compass className="w-5 h-5" />
          <span className="text-xs font-bold pr-1">Menu</span>
        </button>
      </div>
    </>
  );
}
