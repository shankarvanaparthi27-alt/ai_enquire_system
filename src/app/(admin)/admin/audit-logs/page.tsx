'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { AdminAuditLog } from '@/types';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Terminal,
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();

  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('action', actionFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
      }
    } catch {
      showToast({ type: 'error', title: 'Network error loading audit logs' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 mb-2">
            <History className="w-3.5 h-3.5" />
            <span>Immutable Governance Record</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Administrative Audit Trail
          </h1>
          <p className="text-xs text-slate-400">
            Append-only, tamper-proof logs capturing every role assignment, approval decision, and system event.
          </p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          'all',
          'institution_approved',
          'institution_rejected',
          'institution_suspended',
          'role_assigned',
          'representative_activated',
          'super_admin_bootstrap',
          'settings_updated',
        ].map((act) => (
          <button
            key={act}
            onClick={() => setActionFilter(act)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              actionFilter === act
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {act.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <History className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-white">No audit records found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-purple-400">
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{log.email || log.userId}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {log.userId.substring(0, 10)}... ({log.role})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      {log.targetEntity} {log.targetId ? `(${log.targetId.substring(0, 8)}...)` : ''}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition-colors"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-purple-400 uppercase">
                  {selectedLog.action}
                </span>
                <h3 className="text-sm font-bold text-white">Audit Event Signature</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar text-xs">
              <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto space-y-2">
                <div><span className="text-purple-400">Actor UID:</span> {selectedLog.userId}</div>
                <div><span className="text-purple-400">Actor Role:</span> {selectedLog.role}</div>
                <div><span className="text-purple-400">Target Entity:</span> {selectedLog.targetEntity}</div>
                <div><span className="text-purple-400">Target ID:</span> {selectedLog.targetId || 'N/A'}</div>
                {selectedLog.previousState && (
                  <div>
                    <span className="text-amber-400">Previous State:</span>
                    <pre className="text-[10px] text-slate-400 mt-1">{JSON.stringify(selectedLog.previousState, null, 2)}</pre>
                  </div>
                )}
                {selectedLog.newState && (
                  <div>
                    <span className="text-emerald-400">New State:</span>
                    <pre className="text-[10px] text-slate-400 mt-1">{JSON.stringify(selectedLog.newState, null, 2)}</pre>
                  </div>
                )}
                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <span className="text-blue-400">Metadata:</span>
                    <pre className="text-[10px] text-slate-400 mt-1">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
