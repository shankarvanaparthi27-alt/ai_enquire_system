'use client';

import React, { useState } from 'react';
import { College } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { toggleFavouriteCollege } from '@/services/favourites';
import {
  X,
  MapPin,
  Globe,
  Phone,
  Mail,
  Award,
  Star,
  Heart,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface CollegeDetailModalProps {
  college: College | null;
  isOpen: boolean;
  onClose: () => void;
  isFavourite?: boolean;
  onFavouriteChange?: (collegeId: string, newState: boolean) => void;
}

export function CollegeDetailModal({
  college,
  isOpen,
  onClose,
  isFavourite = false,
  onFavouriteChange,
}: CollegeDetailModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [favourited, setFavourited] = useState(isFavourite);
  const [loadingFav, setLoadingFav] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'contact'>('overview');

  if (!isOpen || !college) return null;

  const handleFavouriteToggle = async () => {
    if (!user) {
      showToast({
        type: 'warning',
        title: 'Sign In Required',
        message: 'Please sign in to save colleges to your favourites.',
      });
      return;
    }

    setLoadingFav(true);
    try {
      const newState = await toggleFavouriteCollege(user.uid, college.id);
      setFavourited(newState);
      if (onFavouriteChange) onFavouriteChange(college.id, newState);
      showToast({
        type: 'success',
        title: newState ? t('college.addFavourite') : t('college.removeFavourite'),
        message: `${college.name} updated in your shortlist.`,
      });
    } catch {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: 'Could not update favourites.',
      });
    } finally {
      setLoadingFav(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner */}
        <div className="relative h-48 w-full bg-slate-800 shrink-0">
          <img
            src={college.bannerUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1000&auto=format&fit=crop'}
            alt={college.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/60 hover:bg-slate-950/80 text-white backdrop-blur-md transition-all"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {college.nirfRanking && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-lg">
                <Award className="w-3.5 h-3.5" />
                <span>NIRF Rank #{college.nirfRanking}</span>
              </span>
            )}
            <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-white/20 text-white border border-white/20 backdrop-blur-md">
              {college.category}
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
              {college.collegeType}
            </span>
          </div>

          {/* College Name & Details in Banner */}
          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {college.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{college.city}, {college.state}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{Number(college.rating || 4.5).toFixed(1)} ({Number(college.reviewCount || 0)} reviews)</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Est. {college.establishedYear || 'N/A'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/60 dark:bg-slate-950/40">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Overview & Campus
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'courses'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Academic Programs ({college.courses?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'contact'
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Contact & Admissions
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Institutional Profile
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {college.description}
                </p>
              </div>

              {/* Accreditation & Recognition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="text-[11px] text-slate-400 font-medium">Accreditation Status</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {college.accreditation}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
                  <div className="text-[11px] text-slate-400 font-medium">Institution Category</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                    {college.category} ({college.code})
                  </div>
                </div>
              </div>

              {/* Campus Highlights */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Campus Facilities & Distinctions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(college.features || []).map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-slate-800 dark:text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Accredited Degrees & Programs
              </h4>
              {college.courses && college.courses.length > 0 ? (
                <div className="space-y-3">
                  {college.courses.map((crs) => (
                    <div
                      key={crs.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {crs.name || 'Academic Degree Program'}
                          </div>
                          <div className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                            {crs.department || 'General'} • {crs.degreeLevel || 'Undergraduate'} {crs.durationYears ? `(${crs.durationYears} Years)` : ''}
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {crs.tuitionFeePerYear && Number(crs.tuitionFeePerYear) > 0
                              ? `₹${Number(crs.tuitionFeePerYear).toLocaleString('en-IN')} / year`
                              : 'Subsidized / Nominal Fee'}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Sanctioned Seats: {crs.seats ?? 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Eligibility:</span>{' '}
                        {crs.eligibility || 'Standard University Admission Criteria'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Course catalog is being verified by university registry.
                </div>
              )}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Official Institutional Directory
              </h4>
              {college.contacts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
                    <Phone className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Admission Helpline</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {college.contacts.admissionHelpline || college.contacts.phone || 'Available via university portal'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        General: {college.contacts.phone || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3">
                    <Mail className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Official Email</div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate max-w-[200px]">
                        {college.contacts.email || 'admissions@university.edu'}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-start gap-3 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] text-slate-400 font-medium">Campus Address</div>
                      <div className="text-xs font-medium text-slate-900 dark:text-white mt-0.5">
                        {[
                          college.contacts.address,
                          college.contacts.city || college.city,
                          college.contacts.state || college.state,
                          college.contacts.pincode,
                        ]
                          .filter(Boolean)
                          .join(', ') || `${college.city}, ${college.state}`}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  Campus contact details are available on the official university portal.
                </div>
              )}

              {college.website && (
                <a
                  href={college.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
                >
                  <Globe className="w-4 h-4 text-cyan-500" />
                  <span>Visit Official University Portal ({college.website})</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/80">
          <button
            type="button"
            onClick={handleFavouriteToggle}
            disabled={loadingFav}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              favourited
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Heart className={`w-4 h-4 ${favourited ? 'fill-current' : ''}`} />
            <span>{favourited ? t('college.removeFavourite') : t('college.addFavourite')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
