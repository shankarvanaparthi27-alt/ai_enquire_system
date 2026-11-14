'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { SupportedLanguage } from '@/types';

export function LanguageSelector({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const { language, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Change Language"
      >
        <Globe className="w-3.5 h-3.5 text-cyan-500" />
        <span>{activeLang.flag}</span>
        {variant !== 'compact' && <span className="font-semibold">{activeLang.nativeName}</span>}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur-md z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Select Language
          </div>
          {languages.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm">{lang.flag}</span>
                  <div>
                    <div className="font-medium">{lang.nativeName}</div>
                    <div className="text-[10px] text-slate-400">{lang.name}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
