'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import {
  AdmissionChance,
  CutoffType,
  PredictionItem,
  PredictorInput,
  PredictorResult,
  SupportedLanguage,
} from '@/types';
import {
  GraduationCap,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sliders,
  Building2,
  ArrowRight,
  Clock,
  History,
  RotateCcw,
  Compass,
  FileCheck2,
} from 'lucide-react';

const ENTRANCE_EXAMS = [
  { name: 'JEE Advanced', type: 'rank' as CutoffType, label: 'JEE Adv Rank', placeholder: 'e.g. 850', max: 250000 },
  { name: 'JEE Main', type: 'rank' as CutoffType, label: 'JEE Main CRL Rank', placeholder: 'e.g. 12500', max: 1500000 },
  { name: 'NEET UG', type: 'rank' as CutoffType, label: 'NEET AIR Rank', placeholder: 'e.g. 450', max: 2000000 },
  { name: 'BITSAT', type: 'score' as CutoffType, label: 'BITSAT Score (out of 390)', placeholder: 'e.g. 315', max: 390 },
  { name: 'CAT', type: 'percentile' as CutoffType, label: 'CAT Percentile', placeholder: 'e.g. 98.5', max: 100 },
  { name: 'GATE', type: 'score' as CutoffType, label: 'GATE Score (out of 1000)', placeholder: 'e.g. 780', max: 1000 },
];

const CATEGORIES = ['General', 'OBC-NCL', 'SC', 'ST', 'EWS'];
const QUOTAS = ['All India', 'Home State'];
const DEGREES = [
  { value: 'all', label: 'All Program Levels' },
  { value: 'Undergraduate', label: 'B.Tech / MBBS / B.Sc' },
  { value: 'Postgraduate', label: 'M.Tech / MBA / M.Sc' },
];

export default function AdmissionPredictorPage() {
  const { user, getIdToken } = useAuth();
  const { language: currentLang } = useLanguage();
  const { showToast } = useToast();

  const [selectedExam, setSelectedExam] = useState(ENTRANCE_EXAMS[0]);
  const [scoreOrRank, setScoreOrRank] = useState<string>('850');
  const [category, setCategory] = useState<string>('General');
  const [quota, setQuota] = useState<string>('All India');
  const [targetDegree, setTargetDegree] = useState<string>('Undergraduate');
  const [class12Percentage, setClass12Percentage] = useState<string>('85');

  const [loading, setLoading] = useState(false);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [counselingSummary, setCounselingSummary] = useState<string>('');
  const [history, setHistory] = useState<PredictorResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch prediction history on mount
  useEffect(() => {
    async function loadHistory() {
      if (!user) return;
      try {
        const token = await getIdToken();
        const res = await fetch('/api/predictor/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setHistory(data.data);
        }
      } catch (err) {
        console.error('Error fetching prediction history:', err);
      }
    }
    loadHistory();
  }, [user, getIdToken]);

  // Handle Predict Submission
  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    const numScore = parseFloat(scoreOrRank);
    if (isNaN(numScore) || numScore <= 0) {
      showToast({ type: 'warning', title: 'Invalid Value', message: 'Please enter a valid positive rank, percentile, or score.' });
      return;
    }

    setLoading(true);
    setHasEvaluated(false);

    try {
      const token = user ? await getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/predictor/predict', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          examName: selectedExam.name,
          scoreOrRank: numScore,
          category,
          quota,
          targetDegree,
          class12Percentage: class12Percentage ? parseFloat(class12Percentage) : undefined,
          language: currentLang,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setPredictions(data.data.predictions || []);
        setCounselingSummary(data.data.counselingSummary || '');
        setHasEvaluated(true);

        if (data.data.id && user) {
          // Prepend to history
          const newRecord: PredictorResult = {
            id: data.data.id,
            userId: user.uid,
            examName: selectedExam.name,
            scoreOrRank: numScore,
            category,
            quota,
            targetDegree,
            class12Percentage: class12Percentage ? parseFloat(class12Percentage) : undefined,
            predictions: data.data.predictions || [],
            createdAt: new Date().toISOString(),
          };
          setHistory((prev) => [newRecord, ...prev.slice(0, 19)]);
        }

        showToast({
          type: 'success',
          title: 'Evaluation Complete',
          message: `Evaluated ${data.data.predictions.length} verified cutoff matches.`,
        });
      } else {
        throw new Error(data.error || 'Prediction engine error');
      }
    } catch (err: unknown) {
      console.error('Prediction failed:', err);
      showToast({
        type: 'error',
        title: 'Prediction Failed',
        message: (err as Error)?.message || 'Could not process admission evaluation.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getChanceBadge = (chance: AdmissionChance) => {
    switch (chance) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>High Chance</span>
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Moderate Chance</span>
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Low Chance</span>
          </span>
        );
      case 'Ineligible':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Ineligible</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Insufficient Data</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Deterministic Admissions Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Admission Eligibility Predictor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Calculate your admission probability against verified institutional cutoff benchmarks with zero hallucinated figures.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition-all shadow-xs"
          >
            <History className="w-4 h-4 text-indigo-500" />
            <span>Past Evaluations ({history.length})</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ==================================================================== */}
        {/* Left Form Panel: Examination Inputs                                   */}
        {/* ==================================================================== */}
        <section className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <form onSubmit={handlePredict} className="space-y-4">
            {/* Entrance Exam Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Entrance Examination
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ENTRANCE_EXAMS.map((exam) => {
                  const isSel = selectedExam.name === exam.name;
                  return (
                    <button
                      key={exam.name}
                      type="button"
                      onClick={() => {
                        setSelectedExam(exam);
                        if (exam.type === 'percentile') setScoreOrRank('98.5');
                        else if (exam.type === 'score') setScoreOrRank('320');
                        else setScoreOrRank('1200');
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                        isSel
                          ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {exam.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Score / Rank Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {selectedExam.label}
              </label>
              <input
                type="number"
                step="any"
                min="1"
                max={selectedExam.max}
                required
                value={scoreOrRank}
                onChange={(e) => setScoreOrRank(e.target.value)}
                placeholder={selectedExam.placeholder}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 font-semibold"
              />
            </div>

            {/* Category & Quota */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Quota
                </label>
                <select
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  {QUOTAS.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Degree & 12th Percentage */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Program Level
                </label>
                <select
                  value={targetDegree}
                  onChange={(e) => setTargetDegree(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  {DEGREES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {selectedExam.name === 'CAT' || selectedExam.name === 'GATE'
                    ? "Bachelor's Degree % (Min 50% Gen)"
                    : selectedExam.name === 'NEET UG'
                    ? "12th Board PCB % (Min 50% Gen / 40% Res)"
                    : selectedExam.name === 'BITSAT'
                    ? "12th Board PCM % (Min 75% agg)"
                    : "12th Board % (JoSAA 75% / 65% Criteria)"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="35"
                  max="100"
                  value={class12Percentage}
                  onChange={(e) => setClass12Percentage(e.target.value)}
                  placeholder="e.g. 85.5"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Evaluating Verified Benchmarks...</span>
                </>
              ) : (
                <>
                  <GraduationCap className="w-4 h-4" />
                  <span>Calculate Admission Probability</span>
                </>
              )}
            </button>
          </form>

          {/* Verification Notice */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              All evaluations are historical competitiveness estimates derived from published prior counseling rounds (JoSAA, CSAB, MCC, NTA). They do not constitute guaranteed seat allocations or admission offers.
            </span>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* Right Panel: Deterministic Predictions & Gemini Counseling Summary   */}
        {/* ==================================================================== */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {!hasEvaluated && !loading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Awaiting Examination Details
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                Enter your entrance exam score or rank on the left to calculate realistic admission chances across accredited universities.
              </p>
            </div>
          ) : (
            <>
              {/* Gemini Counseling Summary Brief */}
              {counselingSummary && (
                <div className="bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-purple-500/10 dark:from-indigo-950/40 dark:via-blue-950/20 dark:to-purple-950/30 rounded-2xl p-5 border border-indigo-200/60 dark:border-indigo-800/50 shadow-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                      Admissions Strategic Brief
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {counselingSummary}
                  </p>
                </div>
              )}

              {/* Matches List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Verified Benchmark Matches ({predictions.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Category: {category} • Quota: {quota}
                  </span>
                </div>

                {predictions.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-500">
                      No published cutoff records found for this combination of exam and quota. Check back as new counseling rounds are gazetted.
                    </p>
                  </div>
                ) : (
                  predictions.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3 hover:border-indigo-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.degreeLevel}
                          </span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base mt-1">
                            {item.courseName}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{item.collegeName}</span>
                          </p>
                        </div>
                        {getChanceBadge(item.chance)}
                      </div>

                      {/* Explanation & Benchmarks */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {item.explanation}
                      </div>

                      {/* Benchmark Details & Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                        <div className="flex items-center gap-4 text-[11px] text-slate-500">
                          {item.closingRank != null && (
                            <span>Verified Closing Rank: <strong>{item.closingRank}</strong></span>
                          )}
                          {item.minPercentile != null && (
                            <span>Min Percentile: <strong>{item.minPercentile}</strong></span>
                          )}
                          {item.minScore != null && (
                            <span>Min Score: <strong>{item.minScore}</strong></span>
                          )}
                          <span>Year: <strong>{item.academicYear}</strong></span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/compare?colleges=${item.collegeSlug}`}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Compare
                          </Link>
                          <Link
                            href={`/ai-counselor`}
                            className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Ask Counselor</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Prediction History Drawer Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Previous Admission Evaluations
                </h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {history.map((h) => (
                <div
                  key={h.id}
                  onClick={() => {
                    const matchedExam = ENTRANCE_EXAMS.find((e) => e.name === h.examName) || ENTRANCE_EXAMS[0];
                    setSelectedExam(matchedExam);
                    setScoreOrRank(String(h.scoreOrRank));
                    setCategory(h.category);
                    setQuota(h.quota);
                    setTargetDegree(h.targetDegree);
                    setPredictions(h.predictions || []);
                    setHasEvaluated(true);
                    setShowHistory(false);
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {h.examName} ({h.scoreOrRank})
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                        {h.category} • {h.quota}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {new Date(h.createdAt).toLocaleDateString()} • {h.predictions.length} matching college programs
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
