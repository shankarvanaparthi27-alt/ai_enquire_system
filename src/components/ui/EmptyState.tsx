'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, Search, Compass } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = Search,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-500 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
        {description}
      </p>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
