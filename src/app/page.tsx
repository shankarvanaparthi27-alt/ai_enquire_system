'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { CollegeCard } from '@/components/colleges/CollegeCard';
import { CollegeDetailModal } from '@/components/colleges/CollegeDetailModal';
import { getFeaturedColleges } from '@/services/colleges';
import { College } from '@/types';
import {
  Search,
  Sparkles,
  Compass,
  ArrowRight,
  ShieldCheck,
  Layers,
  Globe2,
  GraduationCap,
  TrendingUp,
  Bot,
  Send,
  Code2,
  Terminal,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [chatPrompt, setChatPrompt] = useState('');
  const [featuredColleges, setFeaturedColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/chat');
  };

  useEffect(() => {
    getFeaturedColleges().then(setFeaturedColleges);
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/colleges?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/colleges');
    }
  };

  const handleOpenDetails = (college: College) => {
    setSelectedCollege(college);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with futuristic background glow */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-bold mb-6 shadow-sm animate-in fade-in zoom-in duration-300">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>{t('landing.badge')}</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
            {t('landing.heroTitle')}
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t('landing.heroSubtitle')}
          </p>

          {/* Central Hero Search Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-8 max-w-2xl mx-auto flex items-center gap-2 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center gap-3 pl-3 flex-1">
              <Search className="w-5 h-5 text-cyan-500 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search.searchPlaceholder')}
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/25 transition-all shrink-0 flex items-center gap-1.5"
            >
              <span>{t('common.search')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick CTA Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/colleges"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-md transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>{t('landing.ctaPrimary')}</span>
            </Link>

            {!user ? (
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
              >
                <span>{t('landing.ctaSecondary')}</span>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all"
              >
                <span>{t('nav.dashboard')}</span>
              </Link>
            )}
          </div>

          {/* Key Metrics Strip */}
          <div className="mt-14 pt-8 border-t border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                500+
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {t('landing.statsColleges')}
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-600 dark:text-cyan-400">
                2,400+
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {t('landing.statsCourses')}
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                28
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {t('landing.statsStates')}
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                100%
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {t('landing.statsAccuracy')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 bg-slate-100/50 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {t('landing.featuresTitle')}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {t('landing.feature1Title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('landing.feature1Desc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {t('landing.feature2Title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('landing.feature2Desc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {t('landing.feature3Title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('landing.feature3Desc')}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {t('landing.feature4Title')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('landing.feature4Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* Universal AI Chatbot Showcase Section                                      */}
      {/* ========================================================================= */}
      <section id="chatbot" className="py-20 relative overflow-hidden bg-gradient-to-b from-slate-900/5 via-cyan-500/5 to-transparent dark:from-slate-950 dark:via-cyan-950/20 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Explanation & Features */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>ChatGPT-Style Universal Assistant</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Ask UniVerse AI Anything. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600">
                  Instant Answers 24/7.
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Experience a modern conversational assistant powered by Google Gemini. From college discovery, NIRF cutoffs, and LPU fee breakdowns to complex C++ coding questions, math doubts, and career guidance.
              </p>

              {/* Feature Checklist */}
              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Universal Knowledge:</strong> Coding, science, math, essays & everyday doubts.</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>2,000+ Verified Colleges:</strong> Official NIRF ranks, fees, and accreditations.</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Token Streaming & Markdown:</strong> Real-time tokens and syntax-highlighted code.</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>6 Languages Supported:</strong> English, Telugu, Hindi, Tamil, Kannada, Punjabi.</span>
                </div>
              </div>

              {/* CTA Button to Full Chatbot */}
              <div className="pt-2">
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  <Bot className="w-4 h-4" />
                  <span>Launch Universal AI Chatbot</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Column: Live Chat Interface Mockup */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
                {/* Mockup Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>UniVerse AI Assistant</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <div className="text-[10px] text-slate-400">Gemini 3.5 Flash-Lite • Live</div>
                    </div>
                  </div>
                  <Link
                    href="/chat"
                    className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Full Screen</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Mockup Message Stream */}
                <div className="p-4 sm:p-5 space-y-4 text-xs max-h-80 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40">
                  {/* User query */}
                  <div className="flex items-start gap-2.5 max-w-[85%] ml-auto flex-row-reverse">
                    <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      U
                    </div>
                    <div className="p-3 rounded-2xl rounded-tr-xs bg-blue-600 text-white shadow-xs leading-relaxed">
                      What are the key differences between IIT Madras and Lovely Professional University (LPU), and how do pointers work in C++?
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex items-start gap-2.5 max-w-[95%] mr-auto">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3.5 rounded-2xl rounded-tl-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-xs space-y-2 leading-relaxed">
                      <p>Here is verified comparative data and a clear C++ pointer explanation:</p>
                      
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1">
                        <div>🏆 <strong>IIT Madras:</strong> NIRF Rank #1 Engineering, Government Institute of National Importance in Chennai. Annual fees ~₹2.15 Lakh/yr.</div>
                        <div>🌟 <strong>Lovely Professional University (LPU):</strong> NIRF Rank #38, NAAC A++ (3.68 score) in Phagwara, Punjab. 600-acre campus with annual fees ~₹1.40 Lakh/yr.</div>
                      </div>

                      <p><strong>C++ Pointer Syntax:</strong></p>
                      <pre className="p-2.5 rounded-xl bg-slate-950 text-cyan-300 font-mono text-[10px] overflow-x-auto">
                        <code>{`int count = 50;\nint* ptr = &count; // ptr holds memory address of count\nstd::cout << *ptr; // Dereference: outputs 50`}</code>
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Mockup Interactive Input Form */}
                <form
                  onSubmit={handleChatSubmit}
                  className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatPrompt}
                    onChange={(e) => setChatPrompt(e.target.value)}
                    placeholder="Ask UniVerse AI anything (colleges, admissions, programming, math)..."
                    className="flex-1 bg-slate-100 dark:bg-slate-950 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xs transition-all shrink-0"
                    title="Send to AI Chatbot"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Prompt Pills */}
                <div className="px-3 pb-3 flex flex-wrap gap-1.5 bg-white dark:bg-slate-900">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider self-center mr-1">
                    Try:
                  </span>
                  {[
                    'Top Engineering Colleges',
                    'Explain C++ Pointers',
                    'LPU Admissions & Fees',
                    'High-Paying Tech Careers',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => router.push('/chat')}
                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Institutions Showcase */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>NIRF Ranked Institutions</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Featured Top Colleges
            </h2>
          </div>
          <Link
            href="/colleges"
            className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors"
          >
            <span>View All Colleges</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredColleges.map((college) => (
            <CollegeCard
              key={college.id}
              college={college}
              onOpenDetails={handleOpenDetails}
            />
          ))}
        </div>
      </section>

      {/* College Detail Modal */}
      <CollegeDetailModal
        college={selectedCollege}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
