'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { InstitutionRepresentative, College, InstitutionRepStatus } from '@/types';
import { searchColleges } from '@/services/colleges';
import {
  Users2,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Mail,
  UserPlus,
} from 'lucide-react';

export default function AdminRepresentativesPage() {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();

  const [representatives, setRepresentatives] = useState<InstitutionRepresentative[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // New Representative Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    collegeId: '',
    fullName: '',
    email: '',
    phone: '',
    designation: 'Admission Officer',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [token, colRes] = await Promise.all([
        getIdToken(),
        searchColleges({ limit: 100 }),
      ]);
      setColleges(colRes.data || []);

      if (!token) return;
      const res = await fetch('/api/admin/representatives', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setRepresentatives(json.data);
      }
    } catch {
      showToast({ type: 'error', title: 'Network error loading representatives' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRepresentative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId || !formData.collegeId || !formData.fullName || !formData.email) {
      showToast({ type: 'error', title: 'Please complete all required fields' });
      return;
    }

    setModalLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin/representatives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success && json.data) {
        showToast({
          type: 'success',
          title: 'Representative Activated!',
          message: `${formData.fullName} is now authorized for the institutional portal.`,
        });
        setRepresentatives((prev) => [json.data, ...prev]);
        setIsModalOpen(false);
        setFormData({
          userId: '',
          collegeId: '',
          fullName: '',
          email: '',
          phone: '',
          designation: 'Admission Officer',
        });
      } else {
        showToast({ type: 'error', title: json.error || 'Failed to activate representative' });
      }
    } catch {
      showToast({ type: 'error', title: 'Network error activating representative' });
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: InstitutionRepStatus) => {
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/admin/representatives/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        showToast({ type: 'info', title: `Representative status updated to ${newStatus}` });
        setRepresentatives((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      } else {
        showToast({ type: 'error', title: json.error || 'Failed to update status' });
      }
    } catch {
      showToast({ type: 'error', title: 'Network error updating representative' });
    }
  };

  const filtered = representatives.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20 mb-2">
            <Users2 className="w-3.5 h-3.5" />
            <span>Campus Liaison Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Institution Representatives
          </h1>
          <p className="text-xs text-slate-400">
            Authorize and manage verified institutional administrators and admissions representatives.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Authorize Representative</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['all', 'active', 'pending', 'suspended'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
              statusFilter === s
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Representatives Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users2 className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-white">No representatives found</div>
            <p className="text-xs text-slate-400">
              There are no representatives matching the current filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Representative</th>
                  <th className="py-3 px-4">Institution Assigned</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {filtered.map((rep) => {
                  const collegeObj = colleges.find((c) => c.id === rep.collegeId);
                  return (
                    <tr key={rep.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{rep.fullName}</div>
                        <div className="text-[10px] text-slate-400">{rep.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200">
                          {collegeObj?.name || rep.college?.name || rep.collegeId}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {collegeObj?.city ? `${collegeObj.city}, ${collegeObj.state}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{rep.designation}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            rep.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : rep.status === 'suspended'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {rep.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {rep.status !== 'active' ? (
                            <button
                              onClick={() => handleUpdateStatus(rep.id, 'active')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold transition-colors"
                            >
                              Activate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(rep.id, 'suspended')}
                              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold transition-colors"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Authorize Representative Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-lg font-black text-white">Authorize Institution Representative</h3>
              <p className="text-xs text-slate-400">
                Grant role-based credentials for managing campus profile, academic programs, and prospectuses.
              </p>
            </div>

            <form onSubmit={handleCreateRepresentative} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Target Institution <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.collegeId}
                  onChange={(e) => setFormData({ ...formData, collegeId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select an accredited institution...</option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — {c.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Representative User UID <span className="text-rose-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="Firebase Authentication User UID"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Dr. K. Ramesh"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Official Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="ramesh@nitw.ac.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Dean of Admissions"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98490 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  {modalLoading ? 'Activating...' : 'Activate Representative'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
