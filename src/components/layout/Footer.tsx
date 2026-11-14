'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-xs transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                UniVerse<span className="text-cyan-500">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('common.appTagline')}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>NIRF & NAAC Verified Data</span>
            </div>
          </div>

          {/* Directory Links */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
              College Streams
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/colleges?type=Engineering%20%26%20Technology" className="hover:text-cyan-500 transition-colors">
                  Engineering & Technology
                </Link>
              </li>
              <li>
                <Link href="/colleges?type=Medical%20%26%20Health%20Sciences" className="hover:text-cyan-500 transition-colors">
                  Medical & Health Sciences
                </Link>
              </li>
              <li>
                <Link href="/colleges?type=Management%20%26%20Business" className="hover:text-cyan-500 transition-colors">
                  Management & Business
                </Link>
              </li>
              <li>
                <Link href="/colleges?type=Law" className="hover:text-cyan-500 transition-colors">
                  Law & Legal Studies
                </Link>
              </li>
            </ul>
          </div>

          {/* Student Hub */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
              Student Hub
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="hover:text-cyan-500 transition-colors">
                  Student Dashboard
                </Link>
              </li>
              <li>
                <Link href="/favourites" className="hover:text-cyan-500 transition-colors">
                  Shortlisted Colleges
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-cyan-500 transition-colors">
                  Profile & Language Preferences
                </Link>
              </li>
              <li>
                <Link href="/chat" className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 hover:underline font-semibold">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Assistant (Chatbot)</span>
                </Link>
              </li>
              <li>
                <Link href="/ai-counselor" className="hover:text-cyan-500 transition-colors">
                  AI College Counselor
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-cyan-500 transition-colors">
                  College Comparison Matrix
                </Link>
              </li>
              <li>
                <Link href="/predictor" className="hover:text-cyan-500 transition-colors">
                  Admission Predictor
                </Link>
              </li>
            </ul>
          </div>

          {/* Multilingual Support */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
              Supported Languages
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 font-medium">🇬🇧 English</span>
              <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 font-medium">🇮🇳 తెలుగు</span>
              <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 font-medium">🇮🇳 हिन्दी</span>
              <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 font-medium">🇮🇳 தமிழ்</span>
              <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 font-medium">🇮🇳 ಕನ್ನಡ</span>
              <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 font-medium">🇮🇳 ਪੰਜਾਬੀ</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            &copy; 2026 UniVerse AI. {t('common.allRightsReserved')}
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              Built with precision for students across India
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
