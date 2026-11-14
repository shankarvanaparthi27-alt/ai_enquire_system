'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CollegeCard } from '@/components/colleges/CollegeCard';
import { CollegeDetailModal } from '@/components/colleges/CollegeDetailModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';
import { getFavouriteColleges } from '@/services/favourites';
import { College } from '@/types';
import { Heart } from 'lucide-react';

export default function FavouritesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const [favourites, setFavourites] = useState<College[]>([]);
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
      getFavouriteColleges(user.uid)
        .then(setFavourites)
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleFavToggle = (collegeId: string, newState: boolean) => {
    if (!newState) {
      setFavourites((prev) => prev.filter((c) => c.id !== collegeId));
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Shortlisted Institutions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('nav.favourites')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Review and track all colleges saved to your personal shortlist.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : favourites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favourites.map((col) => (
              <CollegeCard
                key={col.id}
                college={col}
                isFavourite={true}
                onFavouriteToggle={handleFavToggle}
                onOpenDetails={(c) => {
                  setSelectedCollege(c);
                  setIsModalOpen(true);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title={t('dashboard.emptyFavouritesTitle')}
            description={t('dashboard.emptyFavouritesDesc')}
            actionLabel={t('dashboard.exploreShortcut')}
            actionHref="/colleges"
          />
        )}

      <CollegeDetailModal
        college={selectedCollege}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isFavourite={true}
        onFavouriteChange={handleFavToggle}
      />
    </div>
  );
}
