import React, { Suspense } from 'react';
import InstitutionDetailClient from './InstitutionDetailClient';

export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-slate-900 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-900 rounded-3xl animate-pulse" />
          <div className="h-48 bg-slate-900 rounded-3xl animate-pulse" />
        </div>
      }
    >
      <InstitutionDetailClient id={id} />
    </Suspense>
  );
}
