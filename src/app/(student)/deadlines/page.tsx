'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdmissionDeadline, DeadlineEventType } from '@/types';
import {
  CalendarDays,
  Clock,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  Calendar,
} from 'lucide-react';

const EVENT_TYPE_LABELS: Record<DeadlineEventType, { label: string; color: string }> = {
  application_deadline: { label: 'Application Window', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  counseling_round: { label: 'Counseling & Seat Choice', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  seat_acceptance: { label: 'Seat Acceptance / Fee', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  exam_date: { label: 'Examination Day', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  result_announcement: { label: 'Result Announcement', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  document_verification: { label: 'Document Verification', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
};

function getDaysRemaining(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

export default function DeadlinesPage() {
  const { t } = useLanguage();
  const [deadlines, setDeadlines] = useState<AdmissionDeadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [examFilter, setExamFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [upcomingOnly, setUpcomingOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (examFilter !== 'all') params.append('exam', examFilter);
    if (typeFilter !== 'all') params.append('type', typeFilter);
    if (upcomingOnly) params.append('upcoming', 'true');

    fetch(`/api/deadlines?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setDeadlines(json.data);
        }
      })
      .catch((err) => console.error('Failed to load deadlines:', err))
      .finally(() => setLoading(false));
  }, [examFilter, typeFilter, upcomingOnly]);

  const exams = ['all', 'JEE', 'NEET', 'CAT', 'BITSAT', 'GATE'];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>National Admission & Counseling Calendar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('nav.deadlines') || 'Admission Deadlines & Events'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Official statutory deadlines and counseling milestones curated directly from JoSAA, CSAB, MCC, and top universities.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setUpcomingOnly(false)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              !upcomingOnly
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setUpcomingOnly(true)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              upcomingOnly
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Upcoming Only
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="space-y-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Examination:</span>
          {exams.map((ex) => (
            <button
              key={ex}
              onClick={() => setExamFilter(ex)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                examFilter === ex
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {ex === 'all' ? 'All Examinations' : ex}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Milestone Type:</span>
          {['all', 'counseling_round', 'application_deadline', 'seat_acceptance'].map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                typeFilter === tp
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tp === 'all' ? 'All Milestones' : tp.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Deadlines Timeline Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />
          ))}
        </div>
      ) : deadlines.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No deadlines match your filters</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Try selecting all examinations or resetting event filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {deadlines.map((dl) => {
            const daysLeft = getDaysRemaining(dl.deadlineDate);
            const isUrgent = daysLeft >= 0 && daysLeft <= 7;
            const isPassed = daysLeft < 0;
            const typeInfo = EVENT_TYPE_LABELS[dl.eventType] || EVENT_TYPE_LABELS.application_deadline;

            return (
              <div
                key={dl.id}
                className={`group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between space-y-4 ${
                  isUrgent
                    ? 'border-amber-500/50 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${typeInfo.color}`}
                    >
                      {typeInfo.label}
                    </span>

                    {/* Countdown Pill */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isPassed
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          : isUrgent
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {isPassed
                        ? 'Passed'
                        : daysLeft === 0
                        ? 'Today!'
                        : `${daysLeft}d left`}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-500 transition-colors">
                      {dl.title}
                    </h3>
                    {dl.examName && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>{dl.examName}</span>
                      </p>
                    )}
                  </div>

                  {dl.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {dl.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Milestone Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(dl.deadlineDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {dl.officialUrl ? (
                    <a
                      href={dl.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] hover:bg-blue-500 hover:text-white transition-colors"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
