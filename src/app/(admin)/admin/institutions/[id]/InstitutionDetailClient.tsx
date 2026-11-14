'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { InstitutionApplication } from '@/types';
import {
  Building2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

interface Props {
  id: string;
}

export default function InstitutionDetailClient({ id }: Props) {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { showToast } = useToast();

  const [app, setApp] = useState<InstitutionApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Review inputs
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const loadApplication = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/admin/institutions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setApp(json.data);
      } else {
        showToast({ type: 'error', title: json.error || 'Failed to load institution' });
      }
    } catch {
      showToast({ type: 'error', title: 'Network error loading institution details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadApplication();
  }, [id]);

  const handleUpdateStatus = async (newStatus: 'approved' | 'rejected' | 'suspended') => {
    if (newStatus === 'rejected' && !rejectionReason.trim()) {
      showToast({ type: 'error', title: 'Please provide a rejection reason' });
      return;
    }

    setActionLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/admin/institutions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          reviewNotes,
          rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        showToast({
          type: 'success',
          title: `Institution status updated to ${newStatus}!`,
        });
        setApp(json.data);
      } else {
        showToast({ type: 'error', title: json.error || 'Update failed' });
      }
    } catch {
      showToast({ type: 'error', title: 'Network error updating institution status' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-900 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-900 rounded-3xl animate-pulse" />
        <div className="h-48 bg-slate-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="max-w-md mx-auto text-center p-12 space-y-4">
        <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">Institution Dossier Not Found</h2>
        <Link
          href="/admin/institutions"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Institutions</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/institutions"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-purple-400 text-xs">{app.code}</span>
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
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{app.name}</h1>
          </div>
        </div>

        {app.collegeId && (
          <Link
            href="/colleges"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold"
          >
            <span>Live in Student Directory</span>
          </Link>
        )}
      </div>

      {/* Grid: Details & Review Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Essential Info Card */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Institutional Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Stream / Type</span>
                <span className="font-bold text-white">{app.collegeType}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Category</span>
                <span className="font-bold text-white">{app.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Affiliation</span>
                <span className="font-bold text-white">{app.affiliation || 'Autonomous'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Established</span>
                <span className="font-bold text-white">{app.establishedYear || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Accreditation</span>
                <span className="font-bold text-white">{app.accreditation || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">NIRF Rank</span>
                <span className="font-bold text-amber-400">
                  {app.nirfRanking ? `#${app.nirfRanking}` : 'Unranked'}
                </span>
              </div>
            </div>

            {app.description && (
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-300">
                <span className="text-slate-500 block mb-1">Institutional Overview</span>
                <p className="leading-relaxed">{app.description}</p>
              </div>
            )}
          </div>

          {/* Contact & Location Card */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Campus Contact & Location
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  {app.address ? `${app.address}, ` : ''}
                  {app.city}, {app.state}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                <a href={`mailto:${app.email}`} className="hover:text-purple-400">
                  {app.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{app.phone}</span>
              </div>
              {app.website && (
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                  <a
                    href={app.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-purple-400 truncate"
                  >
                    {app.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Courses Offered */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Accredited Course Offerings ({app.coursesOffered?.length || 0})
            </h2>
            {!app.coursesOffered || app.coursesOffered.length === 0 ? (
              <p className="text-xs text-slate-500">No courses listed in this dossier.</p>
            ) : (
              <div className="space-y-2">
                {app.coursesOffered.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {c.degreeLevel} • {c.durationYears} Years
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-400">
                        ₹{c.tuitionFeePerYear?.toLocaleString('en-IN') || 0} / yr
                      </div>
                      <div className="text-[10px] text-slate-400">{c.seats || 60} Seats</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Administrative Decision Box */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 sticky top-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Compliance Review Actions
            </h2>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Review Remarks</label>
              <textarea
                rows={3}
                placeholder="Internal verification notes..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Rejection Reason</label>
              <textarea
                rows={2}
                placeholder="Required only if rejecting..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-2 pt-2">
              {app.status !== 'approved' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('approved')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Publish to Directory</span>
                </button>
              )}

              {app.status !== 'rejected' && app.status !== 'suspended' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('rejected')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Institution Application</span>
                </button>
              )}

              {app.status === 'approved' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleUpdateStatus('suspended')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Suspend Institution Directory Access</span>
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 space-y-1">
              <div>Submitted by UID: {app.submittedBy}</div>
              <div>Created: {new Date(app.createdAt).toLocaleString()}</div>
              {app.reviewedAt && (
                <div>
                  Reviewed: {new Date(app.reviewedAt).toLocaleString()} by {app.reviewedBy}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
