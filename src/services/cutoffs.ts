import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { mapDatabaseCollege } from '@/services/colleges';
import { CutoffRank, CutoffType, VerificationStatus } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabaseCutoff(row: any): CutoffRank {
  return {
    id: row.id,
    collegeId: row.college_id,
    courseId: row.course_id || undefined,
    examName: row.exam_name,
    cutoffType: row.cutoff_type as CutoffType,
    category: row.category,
    quota: row.quota,
    openingRank: row.opening_rank ?? undefined,
    closingRank: row.closing_rank ?? undefined,
    minPercentile: row.min_percentile != null ? Number(row.min_percentile) : undefined,
    minScore: row.min_score != null ? Number(row.min_score) : undefined,
    maxScore: row.max_score != null ? Number(row.max_score) : undefined,
    round: Number(row.round || 1),
    academicYear: row.academic_year,
    verificationStatus: row.verification_status as VerificationStatus,
    verifiedAt: row.verified_at || undefined,
    verifiedBy: row.verified_by || undefined,
    sourceAuthority: row.source_authority,
    sourceUrl: row.source_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    college: row.colleges ? mapDatabaseCollege(row.colleges) : undefined,
    course: row.courses
      ? {
          id: row.courses.id,
          collegeId: row.courses.college_id,
          name: row.courses.name,
          degreeLevel: row.courses.degree_level,
          department: row.courses.department,
          durationYears: row.courses.duration_years,
          eligibility: row.courses.eligibility,
          seats: row.courses.seats,
          tuitionFeePerYear: Number(row.courses.tuition_fee_per_year || 0),
          currency: row.courses.currency || 'INR',
        }
      : undefined,
  };
}

export interface CutoffFilterParams {
  collegeId?: string;
  courseId?: string;
  examName?: string;
  category?: string;
  quota?: string;
  academicYear?: string;
}

/**
 * Fetch verified cutoff records only. Pending and rejected records are excluded.
 */
export async function getVerifiedCutoffs(params: CutoffFilterParams = {}): Promise<CutoffRank[]> {
  const supabase = typeof window === 'undefined' ? getSupabaseAdmin() : getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) {
    return [];
  }

  let query = supabase
    .from('cutoff_ranks')
    .select('*, colleges(id, name, slug, code, college_type, category, state, city, established_year, accreditation, rating, review_count, min_fee_per_year, max_fee_per_year, is_verified), courses(*)')
    .eq('verification_status', 'verified');

  if (params.collegeId) {
    query = query.eq('college_id', params.collegeId);
  }
  if (params.courseId) {
    query = query.eq('course_id', params.courseId);
  }
  if (params.examName) {
    query = query.ilike('exam_name', params.examName);
  }
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }
  if (params.quota && params.quota !== 'all') {
    query = query.eq('quota', params.quota);
  }
  if (params.academicYear && params.academicYear !== 'all') {
    query = query.eq('academic_year', params.academicYear);
  }

  const { data, error } = await query.order('round', { ascending: true });

  if (error) {
    console.warn('Failed to query verified cutoffs:', error.message);
    return [];
  }

  return (data || []).map(mapDatabaseCutoff);
}
