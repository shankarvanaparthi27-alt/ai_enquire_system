'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { PlatformUserView } from '@/services/admin/users';
import { UserRole } from '@/types';
import {
  UserCheck,
  ShieldCheck,
  Search,
  Sparkles,
  Award,
  TrendingUp,
  BarChart3,
  Building2,
  GraduationCap,
  Eye,
  X,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  FileText,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export default function AdminUsersPage() {
  const { user, getIdToken } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<PlatformUserView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Performance Dossier Modal State
  const [dossierUser, setDossierUser] = useState<PlatformUserView | null>(null);

  // Role Edit Modal State
  const [roleEditUser, setRoleEditUser] = useState<PlatformUserView | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>('student');
  const [targetCollegeId, setTargetCollegeId] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin/users?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsers(json.data);
      }
    } catch {
      showToast({ type: 'error', title: 'Network error loading user directory' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered users based on search and tier selection
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Tier filter
      if (selectedTier !== 'all') {
        if (selectedTier === 'admin' && u.role === 'student') return false;
        if (selectedTier === 'elite' && u.performance.performanceTier !== 'Elite Aspirant') return false;
        if (selectedTier === 'strong' && u.performance.performanceTier !== 'Strong Performer') return false;
        if (selectedTier === 'active' && u.performance.performanceTier !== 'Active Explorer') return false;
        if (selectedTier === 'early' && u.performance.performanceTier !== 'Early Stage') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = u.fullName.toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        const cityMatch = u.city?.toLowerCase().includes(q);
        const examMatch = u.performance.primaryExam?.toLowerCase().includes(q);
        const degreeMatch = (u.targetDegree || u.performance.targetDegree)?.toLowerCase().includes(q);
        return nameMatch || emailMatch || cityMatch || examMatch || degreeMatch;
      }

      return true;
    });
  }, [users, selectedTier, searchQuery]);

  // Aggregate Performance Stats
  const stats = useMemo(() => {
    const total = users.length;
    const elite = users.filter((u) => u.performance.performanceTier === 'Elite Aspirant').length;
    const strong = users.filter((u) => u.performance.performanceTier === 'Strong Performer').length;
    const explorers = users.filter((u) => u.performance.shortlistedCollegesCount > 0).length;
    const avgScore =
      total > 0
        ? Math.round(users.reduce((acc, u) => acc + u.performance.readinessScore, 0) / total)
        : 0;

    return { total, elite, strong, explorers, avgScore };
  }, [users]);

  // Handle Role Assignment
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleEditUser) return;

    setSavingRole(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUid: roleEditUser.userId,
          email: roleEditUser.email,
          role: targetRole,
          collegeId: targetCollegeId || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast({ type: 'success', title: 'Role Updated', message: json.message });
        setUsers((prev) =>
          prev.map((u) => (u.userId === roleEditUser.userId ? { ...u, role: targetRole } : u))
        );
        setRoleEditUser(null);
      } else {
        showToast({ type: 'error', title: json.error || 'Failed to update role' });
      }
    } catch {
      showToast({ type: 'error', title: 'Network error updating role' });
    } finally {
      setSavingRole(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20 mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Student Performance & Institutional Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            User Directory & Performance Engine
          </h1>
          <p className="text-xs text-slate-400">
            Real Supabase user records, entrance exam benchmarks, shortlist activity, and admission readiness scores.
          </p>
        </div>

        <button
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Top Aggregate Performance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-slate-400">Registered Students</span>
          <div className="text-2xl font-black text-white">{stats.total}</div>
          <div className="text-[10px] text-slate-500">Live Supabase profiles</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            <span>Elite Aspirants</span>
          </span>
          <div className="text-2xl font-black text-emerald-400">{stats.elite}</div>
          <div className="text-[10px] text-slate-500">Ready for top-tier seats</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            <span>Strong Performers</span>
          </span>
          <div className="text-2xl font-black text-cyan-400">{stats.strong}</div>
          <div className="text-[10px] text-slate-500">High exam benchmarks</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5">
            <Building2 className="w-3 h-3" />
            <span>Active Explorers</span>
          </span>
          <div className="text-2xl font-black text-purple-400">{stats.explorers}</div>
          <div className="text-[10px] text-slate-500">Shortlisted colleges in Vault</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3" />
            <span>Platform Readiness</span>
          </span>
          <div className="text-2xl font-black text-amber-400">{stats.avgScore}%</div>
          <div className="text-[10px] text-slate-500">Average student metric</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: 'All Users' },
            { id: 'elite', label: 'Elite Aspirants (80%+)' },
            { id: 'strong', label: 'Strong (60-79%)' },
            { id: 'active', label: 'Active (40-59%)' },
            { id: 'early', label: 'Early Stage' },
            { id: 'admin', label: 'Staff / Admins' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTier(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedTier === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, exam, degree..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Users & Performance Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Student Dossier</th>
                <th className="py-3.5 px-4">Academic Benchmark</th>
                <th className="py-3.5 px-4">Performance Index</th>
                <th className="py-3.5 px-4">Engagement Activity</th>
                <th className="py-3.5 px-4">Role & Access</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                      <span>Computing real-time student performance metrics...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No student records matching current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const p = u.performance;
                  return (
                    <tr
                      key={u.userId}
                      className="hover:bg-slate-900/40 transition-colors group cursor-pointer"
                      onClick={() => setDossierUser(u)}
                    >
                      {/* Student Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.fullName}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              u.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {u.role === 'super_admin' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                  SUPER
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                            {u.city && u.state && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                <span>
                                  {u.city}, {u.state}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Academic Benchmark */}
                      <td className="py-3.5 px-4">
                        {p.primaryExam ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[11px]">
                              <Award className="w-3 h-3" />
                              <span>{p.primaryExam}</span>
                              <span className="text-white">#{p.examScoreOrRank}</span>
                            </div>
                            {p.class12Percentage && (
                              <div className="text-[10px] text-slate-400">
                                12th Board: <span className="text-slate-200 font-bold">{p.class12Percentage}%</span>
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500">
                              {p.targetDegree || u.targetDegree || 'Engineering'}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 text-slate-500">
                            <span className="text-[11px] font-medium italic">No exam score submitted</span>
                            {u.targetDegree && (
                              <div className="text-[10px] text-slate-400">Target: {u.targetDegree}</div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Performance Index & Meter */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span
                              className={`font-black uppercase tracking-wider text-[10px] ${
                                p.performanceTier === 'Elite Aspirant'
                                  ? 'text-emerald-400'
                                  : p.performanceTier === 'Strong Performer'
                                  ? 'text-cyan-400'
                                  : p.performanceTier === 'Active Explorer'
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {p.performanceTier}
                            </span>
                            <span className="font-extrabold text-white">{p.readinessScore}%</span>
                          </div>
                          {/* Visual progress bar */}
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                p.performanceTier === 'Elite Aspirant'
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : p.performanceTier === 'Strong Performer'
                                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                                  : p.performanceTier === 'Active Explorer'
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                  : 'bg-slate-600'
                              }`}
                              style={{ width: `${p.readinessScore}%` }}
                            />
                          </div>
                          <div className="text-[9px] text-slate-500">
                            Profile: {p.profileCompletion}% complete
                          </div>
                        </div>
                      </td>

                      {/* Activity & Vault Engagement */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 text-[11px]">
                          <div title="Shortlisted Institutions" className="flex items-center gap-1 text-purple-400">
                            <Building2 className="w-3.5 h-3.5" />
                            <span className="font-bold">{p.shortlistedCollegesCount}</span>
                          </div>
                          <div title="Eligibility Predictions Run" className="flex items-center gap-1 text-cyan-400">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span className="font-bold">{p.predictionsRunCount}</span>
                          </div>
                          <div title="Documents in Vault" className="flex items-center gap-1 text-emerald-400">
                            <FileText className="w-3.5 h-3.5" />
                            <span className="font-bold">{p.documentsUploadedCount}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            u.role === 'super_admin'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : u.role === 'admin'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : u.role === 'institution_admin'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setDossierUser(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                          title="Inspect Student Performance Dossier"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Dossier</span>
                        </button>

                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              setRoleEditUser(u);
                              setTargetRole(u.role);
                              setTargetCollegeId(u.collegeId || '');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold transition-colors"
                            title="Manage Access Role"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Role</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PERFORMANCE DOSSIER DRAWER / MODAL */}
      {dossierUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
                  {dossierUser.avatarUrl ? (
                    <img
                      src={dossierUser.avatarUrl}
                      alt={dossierUser.fullName}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    dossierUser.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">{dossierUser.fullName}</h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        dossierUser.performance.performanceTier === 'Elite Aspirant'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : dossierUser.performance.performanceTier === 'Strong Performer'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {dossierUser.performance.performanceTier}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {dossierUser.email}
                    </span>
                    {dossierUser.city && dossierUser.state && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {dossierUser.city}, {dossierUser.state}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDossierUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Performance Overview Gauge */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Admission Readiness Index
                </span>
                <div className="text-3xl font-black text-white flex items-center gap-2 justify-center sm:justify-start">
                  <span>{dossierUser.performance.readinessScore}%</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-bold">
                    Official Supabase Evaluated
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-sm">
                  {dossierUser.performance.summary}
                </p>
              </div>

              {/* Progress Ring / Meter */}
              <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-purple-500"
                    strokeDasharray={`${dossierUser.performance.readinessScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-sm font-black text-white">
                  {dossierUser.performance.readinessScore}%
                </span>
              </div>
            </div>

            {/* Academic Benchmarks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Entrance Examination</span>
                <div className="text-sm font-bold text-white">
                  {dossierUser.performance.primaryExam || 'Not Submitted'}
                </div>
                {dossierUser.performance.examScoreOrRank && (
                  <div className="text-xs text-blue-400 font-bold">
                    Rank/Score: #{dossierUser.performance.examScoreOrRank}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">12th Board Examinations</span>
                <div className="text-sm font-bold text-white">
                  {dossierUser.performance.class12Percentage
                    ? `${dossierUser.performance.class12Percentage}%`
                    : 'Awaiting Entry'}
                </div>
                <div className="text-xs text-emerald-400 font-bold">
                  {dossierUser.performance.class12Percentage &&
                  dossierUser.performance.class12Percentage >= 75
                    ? '✓ Meets 75% JoSAA Standard'
                    : 'Standard Eligibility'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Target Stream & Degree</span>
                <div className="text-sm font-bold text-white truncate">
                  {dossierUser.targetDegree || dossierUser.performance.targetDegree || 'Undergraduate'}
                </div>
                <div className="text-xs text-purple-400 font-bold">
                  {dossierUser.performance.shortlistedCollegesCount} Shortlisted Colleges
                </div>
              </div>
            </div>

            {/* Performance Strengths */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Identified Academic Strengths</span>
              </h3>
              <div className="space-y-1.5">
                {dossierUser.performance.keyStrengths.map((strength, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{strength}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Counselor & Platform Recommendations */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Actionable Admission Recommendations</span>
              </h3>
              <div className="space-y-1.5">
                {dossierUser.performance.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setDossierUser(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
              >
                Close Performance Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROLE ASSIGNMENT MODAL */}
      {roleEditUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRole}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Manage Platform Role</h3>
              <button
                type="button"
                onClick={() => setRoleEditUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-slate-400">Target Account</span>
              <div className="font-bold text-white">{roleEditUser.fullName}</div>
              <div className="text-slate-400 font-mono text-[11px]">{roleEditUser.email}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Administrative Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="student">Student (Standard User)</option>
                <option value="admin">Administrator (Platform Staff)</option>
                <option value="super_admin">Super Administrator (Full System Authority)</option>
                <option value="institution_admin">Institution Representative (College Liaison)</option>
              </select>
            </div>

            {targetRole === 'institution_admin' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Assigned College ID</label>
                <input
                  type="text"
                  placeholder="e.g. b2d10615-c8e0-4315-905b-fe5f142fc4c0"
                  value={targetCollegeId}
                  onChange={(e) => setTargetCollegeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRoleEditUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingRole}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs text-white font-bold transition-colors shadow-md disabled:opacity-50"
              >
                {savingRole ? 'Saving...' : 'Apply Role Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
