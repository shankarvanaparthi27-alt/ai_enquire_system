'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { PlatformSettings } from '@/types';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Save,
  Building2,
  FileCheck2,
  Users2,
  Sparkles,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const { user, getIdToken } = useAuth();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [bootstrapStatus, setBootstrapStatus] = useState<{ bootstrapAllowed: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const [setRes, bootRes] = await Promise.all([
        fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/bootstrap'),
      ]);

      const [setJson, bootJson] = await Promise.all([setRes.json(), bootRes.json()]);

      if (setJson.success) setSettings(setJson.data);
      if (bootJson.success) setBootstrapStatus(bootJson.data);
    } catch {
      showToast({ type: 'error', title: 'Network error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCategory = async (key: string, value: Record<string, unknown>) => {
    if (!isSuperAdmin) {
      showToast({ type: 'error', title: 'Super Admin authority required to update settings' });
      return;
    }

    setSavingKey(key);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key, value }),
      });

      const json = await res.json();
      if (json.success) {
        showToast({ type: 'success', title: 'Settings Saved', message: `Category "${key}" updated.` });
      } else {
        showToast({ type: 'error', title: json.error || 'Failed to update settings' });
      }
    } catch {
      showToast({ type: 'error', title: 'Network error saving settings' });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading || !settings) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-900 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-900 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20 mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Platform Governance Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Administrative Settings
          </h1>
          <p className="text-xs text-slate-400">
            Configure automated compliance, representative privileges, and global security policies.
          </p>
        </div>
      </div>

      {/* Super Admin Bootstrap Status Card */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Root Security & Bootstrap Status</h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              bootstrapStatus?.bootstrapAllowed
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {bootstrapStatus?.bootstrapAllowed ? 'Bootstrap Available' : 'Bootstrap Locked'}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {bootstrapStatus?.message}
        </p>
        <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
          <span>Active Identity: {user?.email}</span>
          <span className="text-purple-400 uppercase font-bold">Role: {user?.role || 'admin'}</span>
        </div>
      </div>

      {/* Institution Approval Workflow Rules */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span>Institution Approval Workflow</span>
          </h2>
          {isSuperAdmin && (
            <button
              onClick={() => handleSaveCategory('approval_workflow', settings.approvalWorkflow)}
              disabled={savingKey === 'approval_workflow'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingKey === 'approval_workflow' ? 'Saving...' : 'Save Workflow'}</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs cursor-pointer">
            <div>
              <div className="font-bold text-white">Allow Correction Requests</div>
              <div className="text-[10px] text-slate-400">
                Administrators can request revisions from applicants before making a final decision.
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!isSuperAdmin}
              checked={settings.approvalWorkflow.allowCorrectionRequests}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  approvalWorkflow: {
                    ...settings.approvalWorkflow,
                    allowCorrectionRequests: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-purple-600 rounded bg-slate-950 border-slate-800 focus:ring-purple-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs cursor-pointer">
            <div>
              <div className="font-bold text-white">Require Dual Administrator Approval</div>
              <div className="text-[10px] text-slate-400">
                Institutional onboarding requires sign-off from two distinct administrators.
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!isSuperAdmin}
              checked={settings.approvalWorkflow.requireTwoApprovals}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  approvalWorkflow: {
                    ...settings.approvalWorkflow,
                    requireTwoApprovals: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-purple-600 rounded bg-slate-950 border-slate-800 focus:ring-purple-500"
            />
          </label>
        </div>
      </div>

      {/* Representative Permissions */}
      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Users2 className="w-4 h-4 text-cyan-400" />
            <span>Representative Portal Delegations</span>
          </h2>
          {isSuperAdmin && (
            <button
              onClick={() => handleSaveCategory('representative_permissions', settings.representativePermissions)}
              disabled={savingKey === 'representative_permissions'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingKey === 'representative_permissions' ? 'Saving...' : 'Save Permissions'}</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs cursor-pointer">
            <div>
              <div className="font-bold text-white">Permit Direct Fee Updates</div>
              <div className="text-[10px] text-slate-400">
                Liaisons can update annual tuition fees for established courses without re-approval.
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!isSuperAdmin}
              checked={settings.representativePermissions.allowFeeUpdates}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  representativePermissions: {
                    ...settings.representativePermissions,
                    allowFeeUpdates: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-purple-600 rounded bg-slate-950 border-slate-800 focus:ring-purple-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs cursor-pointer">
            <div>
              <div className="font-bold text-white">Require Admin Review for Uploaded Brochures</div>
              <div className="text-[10px] text-slate-400">
                Prospectuses must pass verification before being indexed into the AI Counselor RAG store.
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!isSuperAdmin}
              checked={settings.representativePermissions.requireApprovalForBrochures}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  representativePermissions: {
                    ...settings.representativePermissions,
                    requireApprovalForBrochures: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-purple-600 rounded bg-slate-950 border-slate-800 focus:ring-purple-500"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
