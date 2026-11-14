'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bell, CheckCheck, Info, Sparkles, GraduationCap } from 'lucide-react';

export default function NotificationsPage() {
  const { t } = useLanguage();

  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Welcome to UniVerse AI',
      message: 'Your student account has been created. You can now explore NIRF-ranked institutions and save colleges to your shortlist.',
      timestamp: 'Just now',
      read: false,
      type: 'info',
    },
    {
      id: 'notif-2',
      title: 'Phase 2 AI Counselor Preview',
      message: 'Multi-lingual RAG-based AI College Counselor is in active preparation for Phase 2 development.',
      timestamp: '1 hour ago',
      read: false,
      type: 'ai',
    },
    {
      id: 'notif-3',
      title: 'JEE Advanced & NEET Information',
      message: 'Academic cut-offs and official eligibility criteria have been synced for all central institutes.',
      timestamp: 'Yesterday',
      read: true,
      type: 'admission',
    },
  ]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold border border-cyan-500/20">
              <Bell className="w-3.5 h-3.5" />
              <span>Student Inquiries & Alerts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('notifications.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Stay updated on admissions, shortlist alerts, and system notices.
            </p>
          </div>

          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors shrink-0"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{t('notifications.markAllRead')}</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all ${
                notif.read
                  ? 'border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 opacity-80'
                  : 'border-cyan-500/30 bg-white dark:bg-slate-900/90 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === 'ai'
                      ? 'bg-purple-500/10 text-purple-500'
                      : notif.type === 'admission'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-cyan-500/10 text-cyan-500'
                  }`}
                >
                  {notif.type === 'ai' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : notif.type === 'admission' ? (
                    <GraduationCap className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">{notif.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
