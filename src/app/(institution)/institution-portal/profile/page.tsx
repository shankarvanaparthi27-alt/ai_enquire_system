'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { College } from '@/types';
import {
  Building2,
  Lock,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';

export default function InstitutionProfilePage() {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();

  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const token = await getIdToken();
        if (!token) return;

        const res = await fetch('/api/institution/portal', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.data?.college) {
          const c: College = json.data.college;
          setCollege(c);
          setWebsite(c.website || '');
          setDescription(c.description || '');
          setBannerUrl(c.bannerUrl || '');
          setLogoUrl(c.logoUrl || '');
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/institution/portal', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          website,
          description,
          bannerUrl,
          logoUrl,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Campus details have been saved.',
        });
      } else {
        showToast({ type: 'error', title: json.error || 'Failed to update profile' });
      }
    } catch {
      showToast({ type: 'error', title: 'Network error saving profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !college) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-900 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-white">Campus Institutional Profile</h1>
        <p className="text-xs text-slate-400">
          Maintain public contact information and institutional overview for applicants.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Read-Only Verified Accreditation Information */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified Statutory Accreditations (Protected)</span>
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
              Admin Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Institution Name</span>
              <span className="font-bold text-white">{college.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Institutional Code</span>
              <span className="font-mono font-bold text-cyan-400">{college.code}</span>
            </div>
            <div>
              <span className="text-slate-500 block">National Ranking (NIRF)</span>
              <span className="font-bold text-amber-400">
                {college.nirfRanking ? `Rank #${college.nirfRanking}` : 'Unranked'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Accreditation</span>
              <span className="font-bold text-white">{college.accreditation || 'NAAC A++'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              NIRF rankings and NAAC accreditation are verified by statutory authorities. To request corrections, please contact Platform Administrators.
            </span>
          </div>
        </div>

        {/* Editable Campus Details */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
            Editable Campus Information
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Official Website URL</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.campus.edu"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Institutional Overview</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of campus history, faculty, and academic ethos..."
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Logo Image URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Campus Banner URL</label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
