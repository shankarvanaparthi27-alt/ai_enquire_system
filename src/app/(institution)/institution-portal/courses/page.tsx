'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Course } from '@/types';
import { BookOpen, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';

export default function InstitutionCoursesPage() {
  const { getIdToken } = useAuth();
  const { showToast } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await fetch('/api/institution/portal', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.data?.courses) {
          setCourses(json.data.courses);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Degree Programs & Fee Structure</h1>
          <p className="text-xs text-slate-400">
            View and manage academic programs, approved seat intake, and annual tuition fees.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-900 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-bold text-white">No courses listed yet</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Program Name</th>
                  <th className="py-3 px-4">Level / Dept</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Approved Intake</th>
                  <th className="py-3 px-4 text-right">Annual Tuition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{c.name}</td>
                    <td className="py-3.5 px-4">
                      <div>{c.degreeLevel}</div>
                      <div className="text-[10px] text-slate-400">{c.department}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{c.durationYears} Years</td>
                    <td className="py-3.5 px-4 font-mono">{c.seats} Seats</td>
                    <td className="py-3.5 px-4 text-right font-bold text-cyan-400">
                      ₹{Number(c.tuitionFeePerYear || 0).toLocaleString('en-IN')}
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
