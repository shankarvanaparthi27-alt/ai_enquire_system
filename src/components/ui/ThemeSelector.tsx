'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Laptop, ChevronDown, Check } from 'lucide-react';
import { ThemeMode } from '@/types';

export function ThemeSelector({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5 text-amber-500" /> },
    { mode: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5 text-indigo-400" /> },
    { mode: 'system', label: 'System', icon: <Laptop className="w-3.5 h-3.5 text-slate-400" /> },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`Current theme: ${theme} (resolved: ${resolvedTheme})`}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
        {variant !== 'compact' && <span className="capitalize">{theme}</span>}
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur-md z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Appearance
          </div>
          {options.map((opt) => {
            const isSelected = opt.mode === theme;
            return (
              <button
                key={opt.mode}
                onClick={() => {
                  setTheme(opt.mode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
