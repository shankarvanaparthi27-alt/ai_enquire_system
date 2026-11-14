'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { College } from '@/types';
import { searchColleges } from '@/services/colleges';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import {
  Building2,
  Award,
  DollarSign,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  SlidersHorizontal,
  ArrowRight,
  Star,
  MapPin,
  ExternalLink,
  ChevronDown,
  Layers,
  Search,
} from 'lucide-react';

export default function CollegeComparePageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading comparison matrix...</div>}>
      <CollegeCompareContent />
    </Suspense>
  );
}

function CollegeCompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [availableColleges, setAvailableColleges] = useState<College[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<College[]>([]);
  const [highlightDifferences, setHighlightDifferences] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load master college list
  useEffect(() => {
    async function loadDirectory() {
      try {
        const res = await searchColleges({ limit: 50, sortBy: 'rating' });
        setAvailableColleges(res.data);

        // Pre-select colleges from URL params if present
        const idsParam = searchParams.get('colleges');
        if (idsParam) {
          const ids = idsParam.split(',').map((id) => id.trim());
          const matched = res.data.filter((c) => ids.includes(c.id) || ids.includes(c.slug));
          if (matched.length >= 2) {
            setSelectedColleges(matched.slice(0, 3));
          } else if (res.data.length >= 2) {
            setSelectedColleges(res.data.slice(0, 2));
          }
        } else if (res.data.length >= 2) {
          // Default: pick first two premier institutions
          setSelectedColleges(res.data.slice(0, 2));
        }
      } catch (err) {
        console.error('Failed to load colleges for comparison:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDirectory();
  }, [searchParams]);

  // Sync selected colleges to URL query
  const updateUrl = (colleges: College[]) => {
    const ids = colleges.map((c) => c.slug || c.id).join(',');
    if (ids) {
      router.replace(`/compare?colleges=${ids}`, { scroll: false });
    } else {
      router.replace('/compare', { scroll: false });
    }
  };

  const addCollegeToCompare = (college: College) => {
    if (selectedColleges.some((c) => c.id === college.id)) {
      showToast({ type: 'info', title: 'Already Added', message: `${college.name} is already in the comparison matrix.` });
      return;
    }
    if (selectedColleges.length >= 3) {
      showToast({ type: 'warning', title: 'Maximum 3 Colleges', message: 'You can compare up to 3 institutions simultaneously.' });
      return;
    }
    const updated = [...selectedColleges, college];
    setSelectedColleges(updated);
    updateUrl(updated);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const removeCollege = (collegeId: string) => {
    if (selectedColleges.length <= 1) {
      showToast({ type: 'warning', title: 'Minimum 1 Required', message: 'Keep at least one college or add another to compare.' });
      return;
    }
    const updated = selectedColleges.filter((c) => c.id !== collegeId);
    setSelectedColleges(updated);
    updateUrl(updated);
  };

  // Filter available colleges for dropdown picker
  const filteredDropdownColleges = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return availableColleges
      .filter((c) => !selectedColleges.some((sel) => sel.id === c.id))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q)
      );
  }, [availableColleges, selectedColleges, searchQuery]);

  // Comparison metrics calculations
  const bestNirf = useMemo(() => {
    const rankings = selectedColleges
      .map((c) => c.nirfRanking)
      .filter((r): r is number => typeof r === 'number' && r > 0);
    return rankings.length > 0 ? Math.min(...rankings) : null;
  }, [selectedColleges]);

  const lowestFee = useMemo(() => {
    const fees = selectedColleges
      .map((c) => c.minFeePerYear)
      .filter((f): f is number => typeof f === 'number' && f > 0);
    return fees.length > 0 ? Math.min(...fees) : null;
  }, [selectedColleges]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Side-by-Side Matrix</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Institutional Comparison
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare NIRF ranks, verified fees, course options, cutoffs and facilities across top universities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Highlight Differences Toggle */}
          <button
            onClick={() => setHighlightDifferences(!highlightDifferences)}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
              highlightDifferences
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Highlight Differences</span>
          </button>

          {/* Add College Dropdown Button */}
          {selectedColleges.length < 3 && (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add College ({selectedColleges.length}/3)</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search college name or city..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {filteredDropdownColleges.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4">
                        No additional colleges found.
                      </p>
                    ) : (
                      filteredDropdownColleges.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => addCollegeToCompare(c)}
                          className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between group transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600">
                              {c.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {c.city}, {c.state} • NIRF #{c.nirfRanking || 'N/A'}
                            </p>
                          </div>
                          <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading verified comparison data...</div>
      ) : selectedColleges.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-slate-500">No colleges selected for comparison.</p>
        </div>
      ) : (
        /* Matrix Container */
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            {/* Header row: College Brand Cards */}
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <th className="p-4 w-44 sm:w-56 text-slate-500 font-semibold text-xs uppercase tracking-wider align-top">
                  Institution
                </th>
                {selectedColleges.map((col) => (
                  <th key={col.id} className="p-4 w-72 sm:w-80 align-top">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                          {col.code}
                        </span>
                        {selectedColleges.length > 1 && (
                          <button
                            onClick={() => removeCollege(col.id)}
                            className="p-1 hover:text-red-500 text-slate-400 transition-colors rounded"
                            title="Remove from comparison"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                        {col.name}
                      </h3>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{col.city}, {col.state}</span>
                      </div>

                      {/* AI Counselor Action */}
                      <Link
                        href={`/ai-counselor`}
                        className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-900 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Ask AI Counselor</span>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {/* Category & Status */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Type & Category
                </td>
                {selectedColleges.map((c) => (
                  <td key={c.id} className="p-4 font-medium text-slate-800 dark:text-slate-200">
                    <div className="flex flex-col gap-0.5">
                      <span>{c.collegeType}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                        {c.category} • Estd. {c.establishedYear}
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* NIRF Ranking */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  NIRF Ranking
                </td>
                {selectedColleges.map((c) => {
                  const isBest = c.nirfRanking != null && c.nirfRanking === bestNirf;
                  return (
                    <td key={c.id} className="p-4">
                      {c.nirfRanking ? (
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`font-bold ${isBest ? 'text-amber-600 dark:text-amber-400 text-sm' : 'text-slate-800 dark:text-slate-200'}`}>
                            #{c.nirfRanking} Overall
                          </span>
                          {isBest && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              Best Rank
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Not Ranked / Not Applicable</span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* NAAC / Accreditation */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Accreditation
                </td>
                {selectedColleges.map((c) => (
                  <td key={c.id} className="p-4 text-slate-800 dark:text-slate-200 font-medium">
                    {c.accreditation || 'Recognized by UGC'}
                  </td>
                ))}
              </tr>

              {/* Annual Tuition Fees */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Annual Tuition Fees
                </td>
                {selectedColleges.map((c) => {
                  const isLowest = c.minFeePerYear != null && c.minFeePerYear === lowestFee;
                  return (
                    <td key={c.id} className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{(c.minFeePerYear ?? 0).toLocaleString('en-IN')} - ₹{(c.maxFeePerYear ?? 0).toLocaleString('en-IN')}
                        </span>
                        {isLowest && (
                          <span className="inline-flex items-center w-fit text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Most Subsidized
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">Per Academic Year</span>
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Programs & Courses Offered */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider align-top">
                  Key Programs
                </td>
                {selectedColleges.map((c) => (
                  <td key={c.id} className="p-4 align-top">
                    {c.courses && c.courses.length > 0 ? (
                      <ul className="space-y-1.5">
                        {c.courses.slice(0, 4).map((crs) => (
                          <li key={crs.id} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                            <span>{crs.name}</span>
                          </li>
                        ))}
                        {c.courses.length > 4 && (
                          <li className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            +{c.courses.length - 4} additional accredited programs
                          </li>
                        )}
                      </ul>
                    ) : (
                      <span className="text-slate-400">Course roster available in brochure</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Campus Features & Amenities */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider align-top">
                  Campus Facilities
                </td>
                {selectedColleges.map((c) => (
                  <td key={c.id} className="p-4 align-top">
                    <div className="flex flex-wrap gap-1.5">
                      {c.features && c.features.length > 0 ? (
                        c.features.map((feat, fIdx) => (
                          <span
                            key={fIdx}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>{feat}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400">Hostel, Library, Advanced Labs</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Student Rating & Reviews */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Student Rating
                </td>
                {selectedColleges.map((c) => (
                  <td key={c.id} className="p-4">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {c.rating.toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({c.reviewCount.toLocaleString()} reviews)
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Official Admissions Link */}
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="p-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Official Portal
                </td>
                {selectedColleges.map((c) => (
                  <td key={c.id} className="p-4">
                    {c.website ? (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <span>Visit Official Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Not listed</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
