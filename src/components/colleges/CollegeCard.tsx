'use client';

import React, { useState } from 'react';
import { College } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { toggleFavouriteCollege } from '@/services/favourites';
import { trackRecentlyViewed } from '@/services/recentlyViewed';
import {
  MapPin,
  Star,
  Award,
  Heart,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface CollegeCardProps {
  college: College;
  isFavourite?: boolean;
  onFavouriteToggle?: (collegeId: string, newState: boolean) => void;
  onOpenDetails?: (college: College) => void;
}

export function CollegeCard({
  college,
  isFavourite = false,
  onFavouriteToggle,
  onOpenDetails,
}: CollegeCardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [favourited, setFavourited] = useState(isFavourite);
  const [loadingFav, setLoadingFav] = useState(false);

  const handleFavouriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      showToast({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please sign in to save colleges to your shortlisted favourites.',
      });
      return;
    }

    setLoadingFav(true);
    try {
      const newState = await toggleFavouriteCollege(user.uid, college.id);
      setFavourited(newState);
      if (onFavouriteToggle) onFavouriteToggle(college.id, newState);
      showToast({
        type: 'success',
        title: newState ? t('college.addFavourite') : t('college.removeFavourite'),
        message: `${college.name} ${newState ? 'added to' : 'removed from'} your shortlist.`,
      });
    } catch {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: 'Could not update favourite status.',
      });
    } finally {
      setLoadingFav(false);
    }
  };

  const handleCardClick = () => {
    if (user) {
      trackRecentlyViewed(user.uid, college.id);
    }
    if (onOpenDetails) {
      onOpenDetails(college);
    }
  };

  // Format fee nicely
  const formatFee = (amount?: number) => {
    if (!amount || amount === 0) return 'Subsidized / Nominal';
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L/year`;
    }
    return `₹${amount.toLocaleString('en-IN')}/year`;
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 hover:border-cyan-500/50 dark:hover:border-cyan-500/40 shadow-sm hover:shadow-xl dark:hover:shadow-cyan-950/20 backdrop-blur-sm transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Banner Image */}
      <div className="relative h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={college.bannerUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop'}
          alt={college.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* NIRF Rank or Accreditation Badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {college.nirfRanking && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/90 text-slate-950 shadow-md backdrop-blur-md">
              <Award className="w-3 h-3" />
              <span>NIRF #{college.nirfRanking}</span>
            </span>
          )}
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-900/80 text-white border border-white/10 backdrop-blur-md">
            {college.category}
          </span>
        </div>

        {/* Favourite Button */}
        <button
          type="button"
          onClick={handleFavouriteClick}
          disabled={loadingFav}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all shadow-md ${
            favourited
              ? 'bg-rose-500 text-white shadow-rose-500/30'
              : 'bg-slate-950/60 hover:bg-slate-950/80 text-slate-200 hover:text-rose-400'
          }`}
          title={favourited ? t('college.removeFavourite') : t('college.addFavourite')}
          aria-label="Toggle favourite"
        >
          <Heart className={`w-4 h-4 ${favourited ? 'fill-current' : ''}`} />
        </button>

        {/* Rating at bottom-right of banner */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/80 text-amber-400 text-xs font-bold border border-white/10 backdrop-blur-md">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>{college.rating.toFixed(1)}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 flex flex-col p-5">
        {/* Stream badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 truncate">
            {college.collegeType}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
            <ShieldCheck className="w-3 h-3" />
            <span>Verified</span>
          </div>
        </div>

        {/* College Name */}
        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
          {college.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{college.city}, {college.state}</span>
        </div>

        {/* Key Features preview */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {college.features.slice(0, 2).map((feat, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[140px]"
            >
              {feat}
            </span>
          ))}
          {college.features.length > 2 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-400">
              +{college.features.length - 2}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="my-4 border-t border-slate-100 dark:border-slate-800" />

        {/* Card Footer: Fee & Details Button */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Tuition Fee
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-0.5">
              <span>{formatFee(college.minFeePerYear)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 transition-all"
          >
            <span>{t('college.viewDetails')}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
