'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { DocVerificationStatus, StudentDocType, StudentDocument } from '@/types';
import {
  ShieldCheck,
  Upload,
  FileText,
  Trash2,
  Download,
  CheckCircle2,
  X,
  FileCheck2,
  FileImage,
  Loader2,
  Plus,
} from 'lucide-react';

const DOC_TYPE_LABELS: Record<StudentDocType, string> = {
  class_10_marksheet: 'Class 10th Certificate / Marksheet',
  class_12_marksheet: 'Class 12th / Intermediate Marksheet',
  degree_certificate: 'Undergraduate / Degree Certificate',
  rank_card: 'National Entrance Exam Rank Card',
  category_certificate: 'Category / Caste Certificate (OBC/SC/ST/EWS)',
  identity_proof: 'Government ID Proof (Aadhaar / Passport)',
  transfer_certificate: 'Transfer / Migration Certificate',
  other: 'Other Supporting Document',
};

export default function DocumentLockerPage() {
  const router = useRouter();
  const { user, getIdToken, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Form State
  const [selectedType, setSelectedType] = useState<StudentDocType>('class_12_marksheet');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadDocuments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch('/api/student/documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDocuments(json.data);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) {
      showToast({ type: 'error', title: 'Please select a file to upload' });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast({ type: 'error', title: 'File size exceeds 10 MB limit' });
      return;
    }

    setIsUploading(true);
    try {
      const token = await getIdToken();
      if (!token) {
        showToast({ type: 'error', title: 'Authentication required' });
        return;
      }
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('docType', selectedType);
      formData.append('title', title || DOC_TYPE_LABELS[selectedType]);

      const res = await fetch('/api/student/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.data) {
        showToast({ type: 'success', title: 'Document securely uploaded to vault!' });
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        setTitle('');
        setDocuments((prev) => [json.data, ...prev]);
      } else {
        showToast({ type: 'error', title: json.error || 'Upload failed' });
      }
    } catch {
      showToast({ type: 'error', title: 'Network error while uploading' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, docTitle: string) => {
    if (!user) return;
    if (!confirm(`Are you sure you want to remove "${docTitle}" from your locker?`)) return;

    setIsDeletingId(docId);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch(`/api/student/documents?id=${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showToast({ type: 'info', title: 'Document removed' });
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      } else {
        showToast({ type: 'error', title: json.error || 'Failed to remove document' });
      }
    } catch {
      showToast({ type: 'error', title: 'Network error while deleting' });
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted Digital Document Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('nav.documentLocker') || 'Student Document Locker'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Securely store your official marksheets, certificates, and rank cards for streamlined college admissions.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Storage Vault Meter */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Locker Storage Utilization</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {documents.length} verified documents saved. Private access granted only via authenticated sessions.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
          <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            Private Vault: Active
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Encrypted (AES-256)
          </span>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Document Vault is Empty</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Upload your Class 10th, 12th marksheets, and entrance rank cards to speed up your college applications.
            </p>
          </div>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => {
            const isPdf = doc.mimeType.includes('pdf');

            return (
              <div
                key={doc.id}
                className="group relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      {isPdf ? <FileText className="w-5 h-5" /> : <FileImage className="w-5 h-5" />}
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{doc.verificationStatus.toUpperCase()}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-500 transition-colors line-clamp-1">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {DOC_TYPE_LABELS[doc.docType] || doc.docType}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                    <p className="truncate">File: {doc.fileName}</p>
                    <p>Size: {(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Download / View"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      disabled={isDeletingId === doc.id}
                      onClick={() => handleDelete(doc.id, doc.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                      title="Remove from vault"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Store Document in Vault</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">PDF, PNG, or JPEG up to 10 MB</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Document Classification *</label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    const newType = e.target.value as StudentDocType;
                    setSelectedType(newType);
                    if (!title) setTitle(DOC_TYPE_LABELS[newType]);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Document Label / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBSE Class 12th Board Marksheet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select File *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="space-y-1">
                      <FileCheck2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-500 dark:text-slate-400">
                      <Upload className="w-6 h-6 mx-auto text-slate-400" />
                      <p className="text-xs font-bold">Click to choose PDF or Image file</p>
                      <p className="text-[11px] text-slate-400">Max size 10 MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Encrypting & Storing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload to Vault</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
