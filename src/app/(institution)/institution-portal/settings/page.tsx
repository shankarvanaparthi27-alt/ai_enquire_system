'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, ShieldCheck, Mail, User } from 'lucide-react';

export default function InstitutionSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-white">Representative Account Settings</h1>
        <p className="text-xs text-slate-400">
          Liaison identity and security credentials configured by the platform super-administrator.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Representative Identity</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Representative Email</span>
            <span className="font-bold text-white font-mono">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Firebase User UID</span>
            <span className="font-mono text-slate-300">{user?.uid}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400">Assigned RBAC Role</span>
            <span className="font-bold text-cyan-400 uppercase">{user?.role || 'institution_admin'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
