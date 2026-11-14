'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { College } from '@/types';
import {
  Building2,
  BookOpen,
  FileUp,
  ExternalLink,
  MapPin,
  Globe,
  Award,
  Users,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function InstitutionDashboardPage() {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();

  const [portalData, setPortalData] = useState<{
    college: College;
    courses: unknown[];
    enquiries: unknown[];
    documents: unknown[];
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
        if (json.success && json.data) {
          setPortalData(json.data);
        } else {
          showToast({ type: 'warning', title: json.error || 'Could not load campus data' });
        }
      } catch {
        showToast({ type: 'error', title: 'Network error loading portal' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-900 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const college = portalData?.college;

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
              <Building2 className="w-3.5 h-3.5" />
              <span>Campus Management Headquarters</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {college?.name || 'Your Assigned Campus'}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {college?.city}, {college?.state} • Code: {college?.code}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/institution-portal/profile"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all"
            >
              Manage Profile
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Accredited Courses</span>
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white">{portalData?.courses.length || 0}</div>
          <Link
            href="/institution-portal/courses"
            className="text-xs font-bold text-cyan-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Manage programs</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Brochures & Vault</span>
            <FileUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{portalData?.documents.length || 0}</div>
          <Link
            href="/institution-portal/documents"
            className="text-xs font-bold text-emerald-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Upload prospectus</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
