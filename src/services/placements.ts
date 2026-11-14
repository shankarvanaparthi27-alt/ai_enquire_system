import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { CollegePlacement } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabasePlacement(row: any): CollegePlacement {
  return {
    id: row.id,
    collegeId: row.college_id,
    academicYear: row.academic_year,
    highestPackageLpa: row.highest_package_lpa != null ? Number(row.highest_package_lpa) : undefined,
    averagePackageLpa: row.average_package_lpa != null ? Number(row.average_package_lpa) : undefined,
    medianPackageLpa: row.median_package_lpa != null ? Number(row.median_package_lpa) : undefined,
    placementPercentage: row.placement_percentage != null ? Number(row.placement_percentage) : undefined,
    totalOffers: row.total_offers != null ? Number(row.total_offers) : undefined,
    topRecruiters: Array.isArray(row.top_recruiters) ? row.top_recruiters : [],
    createdAt: row.created_at,
  };
}

/**
 * Fetch placement records for a specific college or all colleges
 */
export async function getCollegePlacements(collegeId?: string): Promise<CollegePlacement[]> {
  const supabase = typeof window === 'undefined' ? getSupabaseAdmin() : getSupabaseClient();
  if (!supabase || !isSupabaseConfigured) {
    return [];
  }

  let query = supabase.from('college_placements').select('*');
  if (collegeId) {
    query = query.eq('college_id', collegeId);
  }

  const { data, error } = await query.order('academic_year', { ascending: false });

  if (error) {
    console.warn('Failed to fetch college placements:', error.message);
    return [];
  }

  return (data || []).map(mapDatabasePlacement);
}
