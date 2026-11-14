'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function InstitutionAnalyticsPage() {
  const { getIdToken } = useAuth();
  const [data, setData] = useState<{
    courses?: unknown[];
    documents?: unknown[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch('/api/institution/portal', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) setData(json.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-white">Campus Engagement Analytics</h1>
        <p className="text-xs text-slate-400">
          Academic program discovery, course interest, and candidate engagement metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-xs font-bold text-slate-400">Active Programs Listed</span>
          <div className="text-3xl font-black text-white">{data?.courses?.length || 0}</div>
          <div className="text-[10px] text-purple-400">Programs visible to students</div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-xs font-bold text-slate-400">Verified Brochures</span>
          <div className="text-3xl font-black text-white">{data?.documents?.length || 0}</div>
          <div className="text-[10px] text-emerald-400">Indexed in AI Knowledge Base</div>
        </div>
      </div>
    </div>
  );
}
