'use client';

import React from 'react';

export function CardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden animate-pulse">
      <div className="h-40 w-full bg-slate-200 dark:bg-slate-800" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="flex gap-2 pt-2">
          <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 animate-pulse space-y-2">
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
      <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  );
}
