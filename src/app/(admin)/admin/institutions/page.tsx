'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { InstitutionApplication, InstitutionApplicationStatus } from '@/types';
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Eye,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

export default function AdminInstitutionsPage() {
  const { user, getIdToken } = useAuth();
  const { showToast } = useToast();

  const [applications, setApplications] = useState<InstitutionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Review modal state
  const [activeReviewApp, setActiveReviewApp] = useState<InstitutionApplication | null>(null);
  const [reviewAction, setReviewAction] = useState<InstitutionApplicationStatus>('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const loadApplications = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/institutions?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setApplications(json.data);
      }
    } catch {
      showToast({ type: 'error', title: 'Network error loading institutions' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [user, selectedStatus]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadApplications();
  };

  const handleOpenReview = (app: InstitutionApplication, action: InstitutionApplicationStatus) => {
    setActiveReviewApp(app);
    setReviewAction(action);
    setReviewNotes('');
    setRejectionReason('');
  };

  const handleExecuteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewApp) return;

    setActionLoadingId(activeReviewApp.id);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/admin/institutions/${activeReviewApp.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: reviewAction,
          reviewNotes,
          rejectionReason: reviewAction === 'rejected' ? rejectionReason : undefined,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        showToast({
          type: 'success',
          title: `Institution status updated to ${reviewAction}!`,
        });
        setApplications((prev) =>
          prev.map((a) => (a.id === activeReviewApp.id ? json.data : a))
        );
        setActiveReviewApp(null);
      } else {
        showToast({ type: 'error', title: json.error || 'Failed to update institution' });
      }
    } catch {
      showToast({ type: 'error', title: 'Network error while updating status' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const tabs: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Dossiers' },
    { id: 'submitted', label: 'Pending Review' },
    { id: 'under_review', label: 'Under Review' },
    { id: 'approved', label: 'Approved (Live)' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'suspended', label: 'Suspended' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Institution Management System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Institutional Applications & Directory
          </h1>
          <p className="text-xs text-slate-400">
            Review submitted college onboarding dossiers, verify accreditations, and grant directory visibility.
          </p>
        </div>

        <Link
          href="/admin/institutions/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Institution</span>
        </Link>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedStatus === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            type="submit"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
            title="Search"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Applications Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-white">No institutional dossiers found</div>
            <p className="text-xs text-slate-400">
              There are no institution onboarding records matching the selected status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Institution Name</th>
                  <th className="py-3 px-4">Code / Type</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">NIRF / Accreditation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{app.name}</div>
                      <div className="text-[10px] text-slate-400">{app.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-purple-400">{app.code}</div>
                      <div className="text-[10px] text-slate-400">{app.collegeType}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{app.city}</div>
                      <div className="text-[10px] text-slate-400">{app.state}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {app.nirfRanking ? (
                        <span className="font-bold text-amber-400">Rank #{app.nirfRanking}</span>
                      ) : (
                        <span className="text-slate-500">Unranked</span>
                      )}
                      <div className="text-[10px] text-slate-400">{app.accreditation || 'NA'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
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
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/institutions/${app.id}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="View Full Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {app.status !== 'approved' && (
                          <button
                            onClick={() => handleOpenReview(app, 'approved')}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors"
                            title="Approve to Directory"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {app.status !== 'rejected' && app.status !== 'suspended' && (
                          <button
                            onClick={() => handleOpenReview(app, 'rejected')}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                            title="Reject Application"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {app.status === 'approved' && (
                          <button
                            onClick={() => handleOpenReview(app, 'suspended')}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                            title="Suspend Institution"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {activeReviewApp && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-black text-purple-400">
                  {reviewAction.toUpperCase()} ACTION
                </span>
              </div>
              <h3 className="text-lg font-black text-white">{activeReviewApp.name}</h3>
              <p className="text-xs text-slate-400">
                Code: {activeReviewApp.code} • {activeReviewApp.city}, {activeReviewApp.state}
              </p>
            </div>

            <form onSubmit={handleExecuteReview} className="space-y-4">
              {reviewAction === 'rejected' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Rejection Reason <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide specific feedback or missing compliance documents..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Administrative Review Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional internal remarks for the audit trail..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {reviewAction === 'approved' && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Approving will immediately sync this institution and its accredited courses to the public student directory.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveReviewApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId !== null}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-lg ${
                    reviewAction === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                      : reviewAction === 'rejected'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                  }`}
                >
                  Confirm {reviewAction.charAt(0).toUpperCase() + reviewAction.slice(1)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
