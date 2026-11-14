'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AdminMetrics } from '@/types';
import {
  Users,
  Building2,
  Clock,
  HelpCircle,
  FileText,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  History,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const { user, getIdToken } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMetrics(json.data);
      } else {
        setError(json.error || 'Failed to load metrics');
      }
    } catch {
      setError('Network connection error while fetching admin metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Executive Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Administration Overview
          </h1>
          <p className="text-xs text-slate-400">
            Real-time higher education institutional oversight, admissions health, and platform governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>All Users</span>
          </Link>
          <Link
            href="/admin/institutions/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Onboard Institution</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Total Students */}
        <Link
          href="/admin/users"
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-blue-500/50 hover:bg-slate-900/60 transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 group-hover:text-blue-400 transition-colors">Users & Students</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? '...' : metrics?.totalStudents ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span>Manage accounts</span>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Approved Colleges */}
        <Link
          href="/admin/institutions"
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-emerald-500/50 hover:bg-slate-900/60 transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-400 transition-colors">Institutions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? '...' : metrics?.totalApprovedInstitutions ?? 0}
          </div>
          <div className="text-[10px] text-emerald-400 font-medium">Live & accredited</div>
        </Link>

        {/* Pending Review */}
        <Link
          href="/admin/institutions?status=submitted"
          className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 hover:border-amber-500/50 hover:bg-slate-900/60 transition-all group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 group-hover:text-amber-400 transition-colors">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {loading ? '...' : metrics?.pendingApplications ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Dossiers in verification</div>
        </Link>

        {/* Representatives */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Representatives</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? '...' : metrics?.totalRepresentatives ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Authorized liaisons</div>
        </div>

        {/* Documents */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Documents</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? '...' : metrics?.totalDocuments ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Brochures & vaults</div>
        </div>
      </div>

      {/* Two Column Layout: Recent Applications + Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white">Recent Institutional Dossiers</h2>
            </div>
            <Link
              href="/admin/institutions"
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : !metrics?.recentApplications || metrics.recentApplications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-800">
              No recent institution applications submitted yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {metrics.recentApplications.map((app) => (
                <Link
                  key={app.id}
                  href={`/admin/institutions/${app.id}`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition-all group"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                      {app.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {app.code} • {app.city}, {app.state}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        app.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : app.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : app.status === 'suspended'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {app.status.replace('_', ' ')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Administrative Audit History Feed */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Audit Trail Stream</h2>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
            >
              <span>Audit Log</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-slate-900 animate-pulse" />
              ))}
            </div>
          ) : !metrics?.recentActivities || metrics.recentActivities.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 rounded-2xl border border-dashed border-slate-800">
              No audit actions logged in current cycle.
            </div>
          ) : (
            <div className="space-y-2.5">
              {metrics.recentActivities.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 gap-3"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-bold text-slate-200">
                      {log.action.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      by <span className="text-slate-300">{log.email || log.userId}</span> • Target:{' '}
                      <span className="text-purple-400">{log.targetEntity}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
