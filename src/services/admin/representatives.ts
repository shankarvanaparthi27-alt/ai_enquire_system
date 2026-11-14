import { getSupabaseAdmin } from '@/lib/supabase/server';
import { InstitutionRepresentative, InstitutionRepStatus } from '@/types';
import { logAdminAction } from './audit';
import { setFirebaseUserCustomClaims } from '@/lib/firebase/admin';

const inMemoryRepresentatives: InstitutionRepresentative[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabaseRep(row: any): InstitutionRepresentative {
  return {
    id: row.id,
    userId: row.user_id,
    collegeId: row.college_id,
    applicationId: row.application_id || undefined,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone || undefined,
    designation: row.designation || 'Admission Officer',
    status: row.status as InstitutionRepStatus,
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    college: row.colleges
      ? {
          id: row.colleges.id,
          name: row.colleges.name,
          slug: row.colleges.slug,
          code: row.colleges.code,
          collegeType: row.colleges.college_type,
          category: row.colleges.category,
          state: row.colleges.state,
          city: row.colleges.city,
          website: row.colleges.website,
          establishedYear: row.colleges.established_year,
          accreditation: row.colleges.accreditation,
          nirfRanking: row.colleges.nirf_ranking,
          rating: Number(row.colleges.rating || 4.0),
          reviewCount: Number(row.colleges.review_count || 0),
          description: row.colleges.description,
          features: row.colleges.features || [],
          isVerified: row.colleges.is_verified,
          createdAt: row.colleges.created_at,
        }
      : undefined,
  };
}

export async function getInstitutionRepresentatives(params?: {
  collegeId?: string;
  status?: string;
  limit?: number;
}): Promise<InstitutionRepresentative[]> {
  const limit = params?.limit || 50;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      let query = supabase
        .from('institution_representatives')
        .select('*, colleges(*)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (params?.collegeId) query = query.eq('college_id', params.collegeId);
      if (params?.status && params.status !== 'all') query = query.eq('status', params.status);

      const { data, error } = await query;
      if (!error && data) {
        return data.map(mapDatabaseRep);
      }
    } catch {
      // In-memory fallback
    }
  }

  let filtered = [...inMemoryRepresentatives];
  if (params?.collegeId) filtered = filtered.filter((r) => r.collegeId === params.collegeId);
  if (params?.status && params.status !== 'all') filtered = filtered.filter((r) => r.status === params.status);
  return filtered.slice(0, limit);
}

export async function getRepresentativeByUserId(userId: string): Promise<InstitutionRepresentative | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('institution_representatives')
        .select('*, colleges(*)')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return mapDatabaseRep(data);
      }
    } catch {
      // In-memory fallback
    }
  }

  return inMemoryRepresentatives.find((r) => r.userId === userId) || null;
}

export interface CreateRepresentativeInput {
  userId: string;
  collegeId: string;
  applicationId?: string;
  fullName: string;
  email: string;
  phone?: string;
  designation?: string;
  assignedBy: string;
}

export async function createInstitutionRepresentative(
  input: CreateRepresentativeInput
): Promise<InstitutionRepresentative> {
  const now = new Date().toISOString();
  const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newRep: InstitutionRepresentative = {
    id,
    userId: input.userId,
    collegeId: input.collegeId,
    applicationId: input.applicationId,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    designation: input.designation || 'Admission Officer',
    status: 'active',
    approvedBy: input.assignedBy,
    approvedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('institution_representatives')
        .insert({
          user_id: input.userId,
          college_id: input.collegeId,
          application_id: input.applicationId || null,
          full_name: input.fullName,
          email: input.email,
          phone: input.phone || null,
          designation: input.designation || 'Admission Officer',
          status: 'active',
          approved_by: input.assignedBy,
          approved_at: now,
        })
        .select()
        .single();

      if (!error && data) {
        newRep.id = data.id;
      }
    } catch {
      // In-memory fallback
    }
  }

  // Grant Firebase Custom Claim for institution_admin
  await setFirebaseUserCustomClaims(input.userId, {
    role: 'institution_admin',
    collegeId: input.collegeId,
  });

  inMemoryRepresentatives.unshift(newRep);

  await logAdminAction({
    userId: input.assignedBy,
    role: 'admin',
    action: 'representative_activated',
    targetEntity: 'institution_representative',
    targetId: newRep.id,
    newState: { userId: input.userId, collegeId: input.collegeId, status: 'active' },
    metadata: { repEmail: input.email, repName: input.fullName },
  });

  return newRep;
}

export async function updateRepresentativeStatus(
  id: string,
  status: InstitutionRepStatus,
  reviewerUid: string
): Promise<InstitutionRepresentative | null> {
  const reps = await getInstitutionRepresentatives({ limit: 100 });
  const rep = reps.find((r) => r.id === id);
  if (!rep) return null;

  const previousState = { status: rep.status };
  rep.status = status;
  rep.updatedAt = new Date().toISOString();

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase
        .from('institution_representatives')
        .update({ status })
        .eq('id', id);
    } catch {
      // In-memory fallback
    }
  }

  // Update or revoke claims
  if (status === 'active') {
    await setFirebaseUserCustomClaims(rep.userId, {
      role: 'institution_admin',
      collegeId: rep.collegeId,
    });
  } else {
    await setFirebaseUserCustomClaims(rep.userId, {
      role: 'student',
    });
  }

  await logAdminAction({
    userId: reviewerUid,
    role: 'admin',
    action: `representative_${status}`,
    targetEntity: 'institution_representative',
    targetId: rep.id,
    previousState,
    newState: { status },
    metadata: { repEmail: rep.email, userId: rep.userId },
  });

  return rep;
}
