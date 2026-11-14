'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupportedLanguage } from '@/types';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@/i18n/languages';
import { getTranslation } from '@/i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key: string) => key,
  languages: SUPPORTED_LANGUAGES,
});

const STORAGE_KEY = 'universe_ai_lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        setLanguageState(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Ignore
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    return getTranslation(language, key, params);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
