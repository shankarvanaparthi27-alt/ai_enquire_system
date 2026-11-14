'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { FileUp, FileText, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function InstitutionDocumentsPage() {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Form
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/institution/portal', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data?.documents) {
        setDocuments(json.data.documents);
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      showToast({ type: 'error', title: 'Please provide document title and select a file' });
      return;
    }

    setUploading(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());

      const res = await fetch('/api/ai/ingest', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        showToast({
          type: 'success',
          title: 'Document Uploaded & Queued',
          message: 'The brochure was successfully uploaded for verification.',
        });
        setTitle('');
        setFile(null);
        loadDocuments();
      } else {
        showToast({ type: 'error', title: json.error || 'Upload failed' });
      }
    } catch {
      showToast({ type: 'error', title: 'Network error uploading document' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-black text-white">Institutional Document Vault</h1>
        <p className="text-xs text-slate-400">
          Upload official prospectus, admission guides, and brochures for student discovery and AI counseling.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Submit Official Document</span>
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Document Title</label>
              <input
                required
                type="text"
                placeholder="e.g. 2026-2027 Information Brochure"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">PDF / Document File</label>
              <input
                required
                type="file"
                accept=".pdf,.txt,.md"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-900 file:text-cyan-400 hover:file:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50"
            >
              {uploading ? 'Ingesting...' : 'Upload & Verify'}
            </button>
          </form>
        </div>

        {/* Existing Documents List */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white">Uploaded Prospectuses ({documents.length})</h2>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 bg-slate-900 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">
              No official documents uploaded yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {documents.map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">{d.title}</div>
                      <div className="text-[10px] text-slate-400">{d.file_name}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
