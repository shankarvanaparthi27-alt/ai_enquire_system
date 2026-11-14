'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CollegeSearchParams, CollegeType, CollegeCategory } from '@/types';
import { RotateCcw, SlidersHorizontal, ChevronDown } from 'lucide-react';

interface SearchFiltersProps {
  filters: CollegeSearchParams;
  onFilterChange: (newFilters: Partial<CollegeSearchParams>) => void;
  onReset: () => void;
}

const COLLEGE_TYPES: CollegeType[] = [
  'Engineering & Technology',
  'Medical & Health Sciences',
  'Management & Business',
  'Law',
  'Arts & Science',
  'Design & Architecture',
  'Agriculture & Allied Sciences',
];

const CATEGORIES: CollegeCategory[] = [
  'Government',
  'Private',
  'Autonomous',
  'Deemed University',
];

const LOCATIONS = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export function SearchFilters({ filters, onFilterChange, onReset }: SearchFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {t('search.filtersHeading')}
          </h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-cyan-500 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{t('search.clearFiltersBtn')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Stream / College Type */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {t('search.collegeTypeLabel')}
          </label>
          <div className="relative">
            <select
              value={filters.collegeType || 'all'}
              onChange={(e) => onFilterChange({ collegeType: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
              className="w-full appearance-none px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              <option value="all">{t('search.allTypes')}</option>
              {COLLEGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Category (Govt / Private) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {t('search.categoryLabel')}
          </label>
          <div className="relative">
            <select
              value={filters.category || 'all'}
              onChange={(e) => onFilterChange({ category: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
              className="w-full appearance-none px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              <option value="all">{t('search.allCategories')}</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Location / State */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {t('search.locationLabel')}
          </label>
          <div className="relative">
            <select
              value={filters.location || 'all'}
              onChange={(e) => onFilterChange({ location: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
              className="w-full appearance-none px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              <option value="all">{t('search.allLocations')}</option>
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Max Annual Fee */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {t('search.feeRangeLabel')}
          </label>
          <div className="relative">
            <select
              value={filters.maxFee ? String(filters.maxFee) : 'any'}
              onChange={(e) => onFilterChange({ maxFee: e.target.value === 'any' ? undefined : Number(e.target.value), page: 1 })}
              className="w-full appearance-none px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              <option value="any">Any Budget</option>
              <option value="50000">Below ₹50,000 / yr</option>
              <option value="150000">Below ₹1.5 Lakh / yr</option>
              <option value="300000">Below ₹3 Lakh / yr</option>
              <option value="600000">Below ₹6 Lakh / yr</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Sort By */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            {t('search.sortByLabel')}
          </label>
          <div className="relative">
            <select
              value={filters.sortBy || 'nirf'}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as CollegeSearchParams['sortBy'], page: 1 })}
              className="w-full appearance-none px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              <option value="nirf">🏆 {t('search.sortNirf')} (Top First)</option>
              <option value="rating">⭐ {t('search.sortRating')}</option>
              <option value="fee-asc">💵 {t('search.sortFeeAsc')}</option>
              <option value="fee-desc">💳 {t('search.sortFeeDesc')}</option>
              <option value="name-asc">🔤 {t('search.sortNameAsc')}</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
