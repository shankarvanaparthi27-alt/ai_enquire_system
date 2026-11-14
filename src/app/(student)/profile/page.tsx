'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { updateStudentProfile } from '@/services/profiles';
import { SupportedLanguage, ThemeMode } from '@/types';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Globe,
  Sun,
  Moon,
  Laptop,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [targetDegree, setTargetDegree] = useState('Engineering & Technology');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(language);
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(theme);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setTargetDegree(profile.targetDegree || 'Engineering & Technology');
      if (profile.preferredLanguage) setSelectedLanguage(profile.preferredLanguage);
      if (profile.preferredTheme) setSelectedTheme(profile.preferredTheme);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      // Update global context settings immediately
      if (selectedLanguage !== language) {
        setLanguage(selectedLanguage);
      }
      if (selectedTheme !== theme) {
        setTheme(selectedTheme);
      }

      await updateStudentProfile(user.uid, {
        fullName,
        phone,
        city,
        state,
        targetDegree,
        preferredLanguage: selectedLanguage,
        preferredTheme: selectedTheme,
      });

      await refreshProfile();
      showToast({
        type: 'success',
        title: 'Settings Saved',
        message: t('profile.savedNotification'),
      });
    } catch {
      showToast({
        type: 'error',
        title: t('common.error'),
        message: 'Could not update profile preferences.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold border border-cyan-500/20">
            <User className="w-3.5 h-3.5" />
            <span>Account & Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('profile.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t('profile.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('profile.personalInfoSection')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('profile.fullName')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('profile.email')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('profile.phone')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('profile.targetDegree')}
                </label>
                <div className="relative">
                  <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    value={targetDegree}
                    onChange={(e) => setTargetDegree(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="Engineering & Technology">B.Tech / Engineering</option>
                    <option value="Medical & Health Sciences">MBBS / Medical Sciences</option>
                    <option value="Management & Business">MBA / Management</option>
                    <option value="Law">B.A. LL.B. / Law</option>
                    <option value="Arts & Science">B.Sc / B.A. / Pure Sciences</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('profile.city')}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Hyderabad, Mumbai, Chennai"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('profile.state')}
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Telangana, Maharashtra"
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preferences: Multilingual & Theme */}
          <div className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 shadow-sm space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('profile.preferencesSection')}
            </h3>

            {/* Language Selector in Settings */}
            <div>
              <div className="mb-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-cyan-500" />
                  <span>{t('profile.languageSetting')}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('profile.languageSettingDesc')}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {languages.map((lang) => {
                  const isSelected = selectedLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs text-left transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <div>
                          <div className="font-semibold">{lang.nativeName}</div>
                          <div className="text-[10px] text-slate-400">{lang.name}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Selector in Settings */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                {t('profile.themeSetting')}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { mode: 'light' as ThemeMode, label: t('profile.themeLight'), icon: Sun },
                  { mode: 'dark' as ThemeMode, label: t('profile.themeDark'), icon: Moon },
                  { mode: 'system' as ThemeMode, label: t('profile.themeSystem'), icon: Laptop },
                ].map(({ mode, label, icon: Icon }) => {
                  const isSelected = selectedTheme === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSelectedTheme(mode)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-xs transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('common.loading') : t('profile.saveBtn')}</span>
          </button>
        </form>
      </div>
  );
}
