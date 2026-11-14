'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminMetrics } from '@/types';
import {
  BarChart3,
  TrendingUp,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PieChart,
} from 'lucide-react';

export default function AdminAnalyticsPage() {
  const { getIdToken } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch('/api/admin/metrics', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success) {
          setMetrics(json.data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalAppsEvaluated =
    (metrics?.totalApprovedInstitutions || 0) +
    (metrics?.rejectedApplications || 0) +
    (metrics?.pendingApplications || 0);

  const approvalRate =
    totalAppsEvaluated > 0
      ? Math.round(((metrics?.totalApprovedInstitutions || 0) / totalAppsEvaluated) * 100)
      : 100;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20 mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Platform Governance & Conversion Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-xs text-slate-400">
            Real Supabase database performance indicators on admissions engagement and directory expansion.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400">Institution Approval Rate</span>
          <div className="text-3xl font-black text-emerald-400">{approvalRate}%</div>
          <div className="text-[10px] text-slate-500">
            {metrics?.totalApprovedInstitutions ?? 0} approved of {totalAppsEvaluated} submitted
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400">Active Representative Coverage</span>
          <div className="text-3xl font-black text-cyan-400">{metrics?.totalRepresentatives ?? 0}</div>
          <div className="text-[10px] text-slate-500">Across verified universities</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-400">Audited Compliance Actions</span>
          <div className="text-3xl font-black text-white">{metrics?.recentActivities?.length ?? 0}+</div>
          <div className="text-[10px] text-slate-500">Logged in immutable audit trail</div>
        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Onboarding Health Breakdown */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            <span>Institution Pipeline Breakdown</span>
          </h2>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-400">Approved & Verified</span>
                <span className="text-white">{metrics?.totalApprovedInstitutions ?? 0}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${totalAppsEvaluated ? ((metrics?.totalApprovedInstitutions || 0) / totalAppsEvaluated) * 100 : 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-400">Under Review</span>
                <span className="text-white">{metrics?.pendingApplications ?? 0}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${totalAppsEvaluated ? ((metrics?.pendingApplications || 0) / totalAppsEvaluated) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-rose-400">Rejected / Suspended</span>
                <span className="text-white">
                  {(metrics?.rejectedApplications || 0) + (metrics?.suspendedInstitutions || 0)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{
                    width: `${totalAppsEvaluated ? (((metrics?.rejectedApplications || 0) + (metrics?.suspendedInstitutions || 0)) / totalAppsEvaluated) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Directory & Community Scale */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Platform Registry Scale</span>
          </h2>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Registered Students</div>
                  <div className="text-[10px] text-slate-500">Active platform learners</div>
                </div>
              </div>
              <div className="text-lg font-black text-cyan-400">{metrics?.totalStudents ?? 0}</div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">College Profiles</div>
                  <div className="text-[10px] text-slate-500">Live indexed institutions</div>
                </div>
              </div>
              <div className="text-lg font-black text-purple-400">{metrics?.totalColleges ?? 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
