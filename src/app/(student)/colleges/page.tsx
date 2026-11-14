'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { CollegeCard } from '@/components/colleges/CollegeCard';
import { CollegeDetailModal } from '@/components/colleges/CollegeDetailModal';
import { SearchFilters } from '@/components/colleges/SearchFilters';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { searchColleges } from '@/services/colleges';
import { getFavouriteColleges } from '@/services/favourites';
import { College, CollegeSearchParams } from '@/types';
import {
  Search,
  Sparkles,
  Compass,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Award,
} from 'lucide-react';

function CollegesContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || '';

  const { t } = useLanguage();
  const { user } = useAuth();

  const [filters, setFilters] = useState<CollegeSearchParams>({
    query: initialQuery,
    collegeType: initialType || undefined,
    sortBy: 'nirf',
    page: 1,
    limit: 12,
  });

  const [colleges, setColleges] = useState<College[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Load favourites for the student
  useEffect(() => {
    if (user) {
      getFavouriteColleges(user.uid).then((favs) => {
        setFavourites(favs.map((f) => f.id));
      });
    }
  }, [user]);

  // Execute search
  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchColleges(filters);
      setColleges(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages || Math.ceil(res.total / (filters.limit || 12)) || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleFilterUpdate = (updates: Partial<CollegeSearchParams>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    if (updates.page && typeof window !== 'undefined') {
      window.scrollTo({ top: 320, behavior: 'smooth' });
    }
  };

  const handleResetFilters = () => {
    setFilters({
      query: '',
      collegeType: undefined,
      category: undefined,
      location: undefined,
      maxFee: undefined,
      minRating: undefined,
      sortBy: 'nirf',
      page: 1,
      limit: 12,
    });
  };

  const handleOpenDetails = (college: College) => {
    setSelectedCollege(college);
    setIsModalOpen(true);
  };

  const handleFavToggle = (collegeId: string, newState: boolean) => {
    setFavourites((prev) => (newState ? [...prev, collegeId] : prev.filter((id) => id !== collegeId)));
  };

  // Sample natural language search chips (Phase 2 preview preparation)
  const aiSearchPrompts = [
    'Top Computer Science engineering colleges',
    'Colleges in Hyderabad with fees below ₹4 Lakh',
    'NIRF Top 10 Institutes of Technology',
    'Government Medical Colleges with MBBS',
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold border border-cyan-500/20">
          <Compass className="w-3.5 h-3.5" />
          <span>Institutional Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('search.title')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          {t('search.subtitle')}
        </p>
      </div>

      {/* Main Search Input & AI Natural Language Prompt Helper */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3 pl-3 flex-1">
            <Search className="w-5 h-5 text-cyan-500 shrink-0" />
            <input
              type="text"
              value={filters.query || ''}
              onChange={(e) => handleFilterUpdate({ query: e.target.value, page: 1 })}
              placeholder={t('search.searchPlaceholder')}
              className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {filters.query && (
            <button
              onClick={() => handleFilterUpdate({ query: '', page: 1 })}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear query"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="sm:hidden px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" />
            <span>Filters</span>
          </button>
        </div>

        {/* AI Natural Language Search Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            <span>AI Search Suggestions:</span>
          </span>
          {aiSearchPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleFilterUpdate({ query: prompt, page: 1 })}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-cyan-500/10 hover:text-cyan-600 dark:hover:text-cyan-400 border border-slate-200/80 dark:border-slate-800 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Structured Filter Panel */}
      <div className={`${showFiltersMobile ? 'block' : 'hidden sm:block'}`}>
        <SearchFilters
          filters={filters}
          onFilterChange={handleFilterUpdate}
          onReset={handleResetFilters}
        />
      </div>

      {/* Results Header: Count & Active Sort & Page Size */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-1 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {total > 0 ? (
              <>
                Showing <span className="text-cyan-600 dark:text-cyan-400 font-black">{((filters.page || 1) - 1) * (filters.limit || 12) + 1}–{Math.min((filters.page || 1) * (filters.limit || 12), total)}</span> of <span className="font-black">{total.toLocaleString()}</span> Institutions
              </>
            ) : (
              '0 Institutions Found'
            )}
          </span>
          {filters.sortBy === 'nirf' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Award className="w-3 h-3" />
              <span>NIRF Order</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
          <span className="text-[11px] text-slate-500 font-medium">Per Page:</span>
          <div className="flex items-center gap-1">
            {[12, 24, 48].map((size) => (
              <button
                key={size}
                onClick={() => handleFilterUpdate({ limit: size, page: 1 })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  (filters.limit || 12) === size
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* College Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: filters.limit || 12 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : colleges.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {colleges.map((college) => (
              <CollegeCard
                key={college.id}
                college={college}
                isFavourite={favourites.includes(college.id)}
                onFavouriteToggle={handleFavToggle}
                onOpenDetails={handleOpenDetails}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Page <span className="font-bold text-slate-900 dark:text-white">{filters.page || 1}</span> of{' '}
                <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span> ({total.toLocaleString()} total colleges)
              </div>

              <div className="flex items-center gap-1.5">
                {/* First page */}
                <button
                  type="button"
                  onClick={() => handleFilterUpdate({ page: 1 })}
                  disabled={(filters.page || 1) <= 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  title="First Page"
                  aria-label="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Previous page */}
                <button
                  type="button"
                  onClick={() => handleFilterUpdate({ page: Math.max(1, (filters.page || 1) - 1) })}
                  disabled={(filters.page || 1) <= 1}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {/* Dynamic Page Buttons */}
                {(() => {
                  const curr = filters.page || 1;
                  const pages = [];
                  const delta = 2;
                  const left = Math.max(1, curr - delta);
                  const right = Math.min(totalPages, curr + delta);

                  if (left > 1) {
                    pages.push(1);
                    if (left > 2) pages.push('...');
                  }

                  for (let p = left; p <= right; p++) {
                    pages.push(p);
                  }

                  if (right < totalPages) {
                    if (right < totalPages - 1) pages.push('...');
                    pages.push(totalPages);
                  }

                  return pages.map((p, idx) =>
                    typeof p === 'number' ? (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleFilterUpdate({ page: p })}
                        className={`min-w-9 h-9 px-2.5 rounded-xl text-xs font-bold transition-all ${
                          curr === p
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                            : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    ) : (
                      <span key={idx} className="px-1 text-slate-400 text-xs font-bold select-none">
                        …
                      </span>
                    )
                  );
                })()}

                {/* Next page */}
                <button
                  type="button"
                  onClick={() => handleFilterUpdate({ page: Math.min(totalPages, (filters.page || 1) + 1) })}
                  disabled={(filters.page || 1) >= totalPages}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last page */}
                <button
                  type="button"
                  onClick={() => handleFilterUpdate({ page: totalPages })}
                  disabled={(filters.page || 1) >= totalPages}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  title="Last Page"
                  aria-label="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title={t('search.noResults')}
          description={t('search.noResultsSuggestion')}
          actionLabel={t('search.clearFiltersBtn')}
          onAction={handleResetFilters}
        />
      )}

      {/* College Detail Modal */}
      <CollegeDetailModal
        college={selectedCollege}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isFavourite={selectedCollege ? favourites.includes(selectedCollege.id) : false}
        onFavouriteChange={handleFavToggle}
      />
    </div>
  );
}

export default function CollegesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <CollegesContent />
    </Suspense>
  );
}

