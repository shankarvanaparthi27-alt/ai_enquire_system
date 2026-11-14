import { getSupabaseAdmin } from '@/lib/supabase/server';
import { AdminMetrics } from '@/types';
import { getAdminAuditLogs } from './audit';
import { getInstitutionApplications } from './institutions';

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = getSupabaseAdmin();

  let totalStudents = 0;
  let totalColleges = 0;
  let totalApprovedInstitutions = 0;
  let pendingApplications = 0;
  let rejectedApplications = 0;
  let suspendedInstitutions = 0;
  let totalRepresentatives = 0;
  let totalEnquiries = 0;
  let openEnquiries = 0;
  let resolvedEnquiries = 0;
  let totalDocuments = 0;

  if (supabase) {
    // 1. Students count from profiles
    try {
      const { count: sCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      totalStudents = sCount || 0;
    } catch {
      // Ignore
    }

    // 2. Colleges count from colleges table
    try {
      const { count: cCount } = await supabase.from('colleges').select('*', { count: 'exact', head: true });
      totalColleges = cCount || 0;
    } catch {
      // Ignore
    }

    // 3. Applications counts from institution_applications
    try {
      const { data: apps } = await supabase.from('institution_applications').select('status');
      if (apps) {
        totalApprovedInstitutions = apps.filter((a) => a.status === 'approved').length;
        pendingApplications = apps.filter((a) => a.status === 'submitted' || a.status === 'under_review').length;
        rejectedApplications = apps.filter((a) => a.status === 'rejected').length;
        suspendedInstitutions = apps.filter((a) => a.status === 'suspended').length;
      }
    } catch {
      // Ignore
    }

    // 4. Representatives count
    try {
      const { count: rCount } = await supabase.from('institution_representatives').select('*', { count: 'exact', head: true });
      totalRepresentatives = rCount || 0;
    } catch {
      // Ignore
    }

    // 5. Documents count
    try {
      const { count: docCount } = await supabase.from('student_documents').select('*', { count: 'exact', head: true });
      totalDocuments = docCount || 0;
    } catch {
      try {
        const { count: docCount2 } = await supabase.from('college_documents').select('*', { count: 'exact', head: true });
        totalDocuments = docCount2 || 0;
      } catch {
        // Ignore
      }
    }
  }

  const [recentActivities, appRes] = await Promise.all([
    getAdminAuditLogs({ limit: 10 }),
    getInstitutionApplications({ limit: 5 }),
  ]);

  return {
    totalStudents,
    totalColleges: Math.max(totalColleges, totalApprovedInstitutions),
    totalApprovedInstitutions,
    pendingApplications,
    rejectedApplications,
    suspendedInstitutions,
    totalRepresentatives,
    totalEnquiries,
    openEnquiries,
    resolvedEnquiries,
    totalDocuments,
    recentActivities,
    recentApplications: appRes.data,
  };
}
