'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { CollegeCard } from '@/components/colleges/CollegeCard';
import { CollegeDetailModal } from '@/components/colleges/CollegeDetailModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { getFavouriteColleges } from '@/services/favourites';
import { getRecentlyViewedColleges } from '@/services/recentlyViewed';
import { College, StudentActivityLog } from '@/types';
import {
  Search,
  Heart,
  Clock,
  Compass,
  ArrowRight,
  MessageSquare,
  GitCompare,
  TrendingUp,
  GraduationCap,
  AlertCircle,
  FileCheck,
  CalendarDays,
  ShieldCheck,
  Award,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, profile, getIdToken, loading: authLoading, resendVerificationEmail, reloadUser } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [favourites, setFavourites] = useState<College[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<College[]>([]);
  const [activities, setActivities] = useState<StudentActivityLog[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [resending, setResending] = useState(false);
  const [checkingVerified, setCheckingVerified] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      showToast({
        type: 'info',
        title: 'Verification Link Sent',
        message: `A verification link has been dispatched to ${user?.email}.`,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Could not send verification email. Please try again later.',
      });
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setCheckingVerified(true);
    try {
      const isVerified = await reloadUser();
      if (isVerified) {
        showToast({
          type: 'success',
          title: 'Account Verified!',
          message: 'Your email has been verified successfully.',
        });
      } else {
        showToast({
          type: 'warning',
          title: 'Verification Pending',
          message: 'Email not verified yet. Please click the link in your inbox.',
        });
      }
    } catch {
      showToast({
        type: 'error',
        title: 'Status Check Failed',
        message: 'Could not refresh verification status.',
      });
    } finally {
      setCheckingVerified(false);
    }
  };

  // Protect student dashboard route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      Promise.all([
        getFavouriteColleges(user.uid),
        getRecentlyViewedColleges(user.uid),
      ]).then(([favs, recents]) => {
        setFavourites(favs);
        setRecentlyViewed(recents);
      });

      // Load student activity logs
      getIdToken()
        .then((token) => {
          if (!token) return null;
          return fetch('/api/student/activities?limit=5', {
            headers: { Authorization: `Bearer ${token}` },
          });
        })
        .then((res) => (res ? res.json() : null))
        .then((json) => {
          if (json?.success && Array.isArray(json.data)) {
            setActivities(json.data);
          }
        })
        .catch(() => {});
    }
  }, [user, getIdToken]);

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      router.push(`/colleges?q=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      router.push('/colleges');
    }
  };

  const handleOpenDetails = (college: College) => {
    setSelectedCollege(college);
    setIsModalOpen(true);
  };

  const handleFavToggle = (collegeId: string, newState: boolean) => {
    if (!newState) {
      setFavourites((prev) => prev.filter((c) => c.id !== collegeId));
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const studentName = profile?.fullName || user?.displayName || 'Student';

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Email Verification Pending Banner */}
      {user && !user.emailVerified && (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Email Verification Pending</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {user.email}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                Please verify your email address to unlock official university communications, application trackers, and verified student status.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="px-3.5 py-2 rounded-xl border border-amber-500/30 hover:bg-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend Link'}
            </button>
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checkingVerified}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              {checkingVerified ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        </div>
      )}

      {/* Administrative Account Active Banner */}
      {user && (user.role === 'super_admin' || user.role === 'admin' || user.claims?.admin === true) && (
        <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Super Administrator Privileges Active</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500 text-white">
                  {user.role}
                </span>
              </h4>
              <p className="text-xs text-slate-300">
                You are currently viewing the student portal. Your account has full administrative authority over UniVerse AI.
              </p>
            </div>
          </div>
          <Link
            href="/admin/overview"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all shrink-0"
          >
            <span>Open Administration Console</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Welcome Banner Card with Glassmorphic Gradient */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-gradient-to-r from-cyan-500/10 via-blue-600/10 to-purple-600/10 dark:from-cyan-950/40 dark:via-blue-950/40 dark:to-purple-950/20 p-6 sm:p-8 backdrop-blur-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold border border-cyan-500/20">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('dashboard.welcome', { name: studentName })}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              {t('dashboard.welcomeSub')}
            </p>
          </div>

          {/* Quick Action Button */}
          <Link
            href="/colleges"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all shrink-0"
          >
            <Compass className="w-4 h-4" />
            <span>{t('dashboard.exploreShortcut')}</span>
          </Link>
        </div>
      </div>

      {/* Quick Search Shortcut */}
      <form
        onSubmit={handleQuickSearch}
        className="flex items-center gap-2 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-sm backdrop-blur-md"
      >
        <div className="flex items-center gap-3 pl-3 flex-1">
          <Search className="w-4 h-4 text-cyan-500 shrink-0" />
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            placeholder={t('dashboard.quickSearchPrompt')}
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-white shadow-sm transition-all shrink-0 flex items-center gap-1"
        >
          <span>{t('common.search')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {favourites.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('dashboard.statsSaved')}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {recentlyViewed.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('dashboard.statsRecent')}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {profile?.targetDegree || 'Engineering'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t('dashboard.targetDegree')}
            </div>
          </div>
        </div>
      </div>

      {/* Admissions & Student Vault Hub (Part 3) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Admissions & Student Vault Hub
            </h2>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">
            Part 3 Workflow
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/deadlines"
            className="p-5 rounded-2xl border border-amber-500/20 bg-white dark:bg-slate-900 hover:border-amber-500/50 hover:shadow-md transition-all group space-y-2 block"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
              Admission Deadlines
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified national dates for JoSAA, CSAB, NEET, CAT, and college iterations.
            </p>
          </Link>

          <Link
            href="/document-locker"
            className="p-5 rounded-2xl border border-emerald-500/20 bg-white dark:bg-slate-900 hover:border-emerald-500/50 hover:shadow-md transition-all group space-y-2 block"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
              Document Locker
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Private, encrypted vault for 10th/12th marksheets and rank cards.
            </p>
          </Link>
        </div>
      </div>

      {/* AI Intelligence Suite Cards (Part 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/ai-counselor"
          className="p-5 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent dark:bg-cyan-950/20 space-y-3 hover:border-cyan-500/40 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-xs">
              <MessageSquare className="w-4 h-4" />
              <span>AI College Counselor</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Active Live
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Ask questions across 6 regional languages with real-time vector citations from verified brochures.
          </p>
          <div className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Start Counseling</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/compare"
          className="p-5 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent dark:bg-indigo-950/20 space-y-3 hover:border-indigo-500/40 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
              <GitCompare className="w-4 h-4" />
              <span>Comparison Matrix</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              Ready
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Compare 2–3 colleges side-by-side with difference highlighting across fees, NIRF ranks, and programs.
          </p>
          <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
            <span>Compare Colleges</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <Link
          href="/predictor"
          className="p-5 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent dark:bg-purple-950/20 space-y-3 hover:border-purple-500/40 hover:shadow-md transition-all group block"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs">
              <GraduationCap className="w-4 h-4" />
              <span>Eligibility Predictor</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              Deterministic
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Test your entrance exam score against verified closing ranks with 12th board eligibility gating.
          </p>
          <div className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
            <span>Predict Chances</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* Student Audit Activity Feed (Section 21) */}
      {activities.length > 0 && (
        <div className="space-y-3 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Student Activities & Audit Trail</h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Section 21 Verified</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activities.map((act) => (
              <div key={act.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 dark:text-white">{act.title}</p>
                  {act.description && <p className="text-slate-500 dark:text-slate-400 text-[11px]">{act.description}</p>}
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Favourites Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t('dashboard.favouritesTitle')}
            </h2>
          </div>
          {favourites.length > 0 && (
            <Link
              href="/favourites"
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              View all ({favourites.length})
            </Link>
          )}
        </div>

        {favourites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favourites.slice(0, 3).map((col) => (
              <CollegeCard
                key={col.id}
                college={col}
                isFavourite={true}
                onFavouriteToggle={handleFavToggle}
                onOpenDetails={handleOpenDetails}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title={t('dashboard.emptyFavouritesTitle')}
            description={t('dashboard.emptyFavouritesDesc')}
            actionLabel={t('dashboard.exploreShortcut')}
            actionHref="/colleges"
          />
        )}
      </div>

      {/* Recently Viewed Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-500" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t('dashboard.recentlyViewedTitle')}
            </h2>
          </div>
          {recentlyViewed.length > 0 && (
            <Link
              href="/recently-viewed"
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              View history
            </Link>
          )}
        </div>

        {recentlyViewed.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyViewed.slice(0, 3).map((col) => (
              <CollegeCard
                key={col.id}
                college={col}
                isFavourite={favourites.some((f) => f.id === col.id)}
                onFavouriteToggle={handleFavToggle}
                onOpenDetails={handleOpenDetails}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title={t('dashboard.emptyRecentTitle')}
            description={t('dashboard.emptyRecentDesc')}
            actionLabel={t('dashboard.exploreShortcut')}
            actionHref="/colleges"
          />
        )}
      </div>

      {/* College Detail Modal */}
      <CollegeDetailModal
        college={selectedCollege}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isFavourite={selectedCollege ? favourites.some((f) => f.id === selectedCollege.id) : false}
        onFavouriteChange={handleFavToggle}
      />
    </div>
  );
}
