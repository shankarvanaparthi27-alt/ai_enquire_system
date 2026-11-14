'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CollegeCard } from '@/components/colleges/CollegeCard';
import { CollegeDetailModal } from '@/components/colleges/CollegeDetailModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';
import { getRecentlyViewedColleges } from '@/services/recentlyViewed';
import { getFavouriteColleges } from '@/services/favourites';
import { College } from '@/types';
import { Clock } from 'lucide-react';

export default function RecentlyViewedPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [recentColleges, setRecentColleges] = useState<College[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        getRecentlyViewedColleges(user.uid),
        getFavouriteColleges(user.uid),
      ])
        .then(([recents, favs]) => {
          setRecentColleges(recents);
          setFavourites(favs.map((f) => f.id));
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold border border-cyan-500/20">
            <Clock className="w-3.5 h-3.5" />
            <span>Browsing History</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('nav.recentlyViewed')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Access colleges and courses you recently explored.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : recentColleges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentColleges.map((col) => (
              <CollegeCard
                key={col.id}
                college={col}
                isFavourite={favourites.includes(col.id)}
                onOpenDetails={(c) => {
                  setSelectedCollege(c);
                  setIsModalOpen(true);
                }}
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

      <CollegeDetailModal
        college={selectedCollege}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
