'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  FileCheck2,
  Building2,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface CollegeDocRow {
  id: string;
  college_id: string;
  title: string;
  file_name: string;
  file_url: string;
  doc_type: string;
  academic_year: string;
  is_verified: boolean;
  created_at: string;
  colleges?: {
    name: string;
    code: string;
    city: string;
    state: string;
  };
}

export default function AdminDocumentsPage() {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<CollegeDocRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin/documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDocuments(json.data);
      }
    } catch {
      showToast({ type: 'error', title: 'Network error loading documents' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 mb-2">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Document Verification & Ingestion Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Institutional Document Vault
          </h1>
          <p className="text-xs text-slate-400">
            Verify prospectuses, brochures, and NIRF disclosures used by the AI counselor knowledge engine.
          </p>
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-white">No institutional documents found</div>
            <p className="text-xs text-slate-400">
              Approved institutions have not yet uploaded prospectuses or documents.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Associated Institution</th>
                  <th className="py-3 px-4">Type / Year</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4 text-right">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>{doc.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{doc.file_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">
                        {doc.colleges?.name || doc.college_id}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {doc.colleges?.code} • {doc.colleges?.city}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      {doc.doc_type || 'Brochure'} ({doc.academic_year || '2026-2027'})
                    </td>
                    <td className="py-3.5 px-4">
                      {doc.is_verified ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified & Indexed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {doc.file_url ? (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 text-xs font-bold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </a>
                      ) : (
                        <span className="text-slate-600 text-xs">No link</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
