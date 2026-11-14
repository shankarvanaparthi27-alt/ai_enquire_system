'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Building2, ArrowLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function NewInstitutionPage() {
  const router = useRouter();
  const { getIdToken } = useAuth();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    collegeType: 'Engineering & Technology',
    category: 'Autonomous',
    affiliation: '',
    establishedYear: new Date().getFullYear() - 10,
    state: '',
    city: '',
    address: '',
    website: '',
    email: '',
    phone: '',
    description: '',
    accreditation: 'NAAC A++',
    nirfRanking: '',
    logoUrl: '',
    bannerUrl: '',
  });

  const [courses, setCourses] = useState<Array<{
    name: string;
    degreeLevel: string;
    department: string;
    durationYears: number;
    tuitionFeePerYear: number;
    seats: number;
  }>>([
    {
      name: 'Computer Science and Engineering',
      degreeLevel: 'Undergraduate',
      department: 'Engineering',
      durationYears: 4,
      tuitionFeePerYear: 180000,
      seats: 120,
    },
  ]);

  const addCourse = () => {
    setCourses((prev) => [
      ...prev,
      {
        name: '',
        degreeLevel: 'Undergraduate',
        department: 'Engineering',
        durationYears: 4,
        tuitionFeePerYear: 150000,
        seats: 60,
      },
    ]);
  };

  const removeCourse = (idx: number) => {
    setCourses((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCourse = (idx: number, field: string, val: any) => {
    setCourses((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.state || !formData.city || !formData.email || !formData.phone) {
      showToast({ type: 'error', title: 'Please complete all required fields' });
      return;
    }

    setSubmitting(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin/institutions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          status: 'approved',
          establishedYear: Number(formData.establishedYear),
          nirfRanking: formData.nirfRanking ? Number(formData.nirfRanking) : undefined,
          coursesOffered: courses.filter((c) => c.name.trim()),
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        showToast({
          type: 'success',
          title: 'Institution Added & Published!',
          message: `${formData.name} is now saved in Supabase and visible to all users!`,
        });
        router.push('/admin/institutions');
      } else {
        showToast({ type: 'error', title: json.error || 'Failed to submit institution' });
      }
    } catch {
      showToast({ type: 'error', title: 'Network error while submitting dossier' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/institutions"
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Onboard Higher Education Institution
          </h1>
          <p className="text-xs text-slate-400">
            Submit a complete institutional registration dossier for academic review.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Institutional Identity */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span>Institutional Identity & Accreditation</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">
                Official Institution Name <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. National Institute of Technology Warangal"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Institutional Code <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. NITW"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">College Type</label>
              <select
                value={formData.collegeType}
                onChange={(e) => setFormData({ ...formData, collegeType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Engineering & Technology">Engineering & Technology</option>
                <option value="Medical & Health Sciences">Medical & Health Sciences</option>
                <option value="Management & Business">Management & Business</option>
                <option value="Arts & Science">Arts & Science</option>
                <option value="Law">Law</option>
                <option value="Design & Architecture">Design & Architecture</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Governance Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Government">Government / Institute of National Importance</option>
                <option value="Autonomous">Autonomous</option>
                <option value="Deemed University">Deemed University</option>
                <option value="Private">Private</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">University Affiliation</label>
              <input
                type="text"
                placeholder="e.g. Autonomous / JNTU / AICTE"
                value={formData.affiliation}
                onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Accreditation Grade</label>
              <input
                type="text"
                placeholder="e.g. NAAC A++, NBA Accredited"
                value={formData.accreditation}
                onChange={(e) => setFormData({ ...formData, accreditation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">NIRF Overall / Stream Rank</label>
              <input
                type="number"
                placeholder="e.g. 21 (Leave empty if unranked)"
                value={formData.nirfRanking}
                onChange={(e) => setFormData({ ...formData, nirfRanking: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Location & Contact Information */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            Location & Contact Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                State <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Telangana"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                City <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Warangal"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">Full Postal Address</label>
              <input
                type="text"
                placeholder="e.g. National Highway 163, Hanamkonda"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Official Admission Email <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="email"
                placeholder="admissions@nitw.ac.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">
                Helpline Phone Number <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="+91 870 2459191"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-300">Official Website URL</label>
              <input
                type="url"
                placeholder="https://www.nitw.ac.in"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Academic Course Offerings */}
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white">Degree Programs & Course Offerings</h2>
            <button
              type="button"
              onClick={addCourse}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-purple-400"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course</span>
            </button>
          </div>

          <div className="space-y-3">
            {courses.map((course, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Course #{idx + 1}</span>
                  {courses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCourse(idx)}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Remove course"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Program Name</label>
                    <input
                      type="text"
                      placeholder="e.g. B.Tech Computer Science and Engineering"
                      value={course.name}
                      onChange={(e) => updateCourse(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Degree Level</label>
                    <select
                      value={course.degreeLevel}
                      onChange={(e) => updateCourse(idx, 'degreeLevel', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Undergraduate">Undergraduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Doctoral">Doctoral</option>
                      <option value="Diploma">Diploma</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Duration (Years)</label>
                    <input
                      type="number"
                      value={course.durationYears}
                      onChange={(e) => updateCourse(idx, 'durationYears', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Approved Seats</label>
                    <input
                      type="number"
                      value={course.seats}
                      onChange={(e) => updateCourse(idx, 'seats', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400">Annual Tuition (INR)</label>
                    <input
                      type="number"
                      value={course.tuitionFeePerYear}
                      onChange={(e) => updateCourse(idx, 'tuitionFeePerYear', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/institutions"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? 'Submitting Dossier...' : 'Submit Institutional Dossier'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
