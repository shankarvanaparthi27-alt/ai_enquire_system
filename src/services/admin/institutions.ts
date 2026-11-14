import { getSupabaseAdmin } from '@/lib/supabase/server';
import { InstitutionApplication, InstitutionApplicationStatus } from '@/types';
import { logAdminAction } from './audit';

const inMemoryApplications: InstitutionApplication[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabaseInstApp(row: any): InstitutionApplication {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    collegeType: row.college_type,
    category: row.category,
    affiliation: row.affiliation || undefined,
    establishedYear: row.established_year ? Number(row.established_year) : undefined,
    state: row.state,
    city: row.city,
    address: row.address || undefined,
    website: row.website || undefined,
    email: row.email,
    phone: row.phone,
    description: row.description || undefined,
    accreditation: row.accreditation || undefined,
    nirfRanking: row.nirf_ranking ? Number(row.nirf_ranking) : undefined,
    logoUrl: row.logo_url || undefined,
    bannerUrl: row.banner_url || undefined,
    documents: Array.isArray(row.documents) ? row.documents : [],
    coursesOffered: Array.isArray(row.courses_offered) ? row.courses_offered : [],
    status: row.status as InstitutionApplicationStatus,
    submittedBy: row.submitted_by,
    reviewNotes: row.review_notes || undefined,
    rejectionReason: row.rejection_reason || undefined,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
    collegeId: row.college_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface SubmitInstitutionInput {
  name: string;
  code: string;
  collegeType: string;
  category: string;
  affiliation?: string;
  establishedYear?: number;
  state: string;
  city: string;
  address?: string;
  website?: string;
  email: string;
  phone: string;
  description?: string;
  accreditation?: string;
  nirfRanking?: number;
  logoUrl?: string;
  bannerUrl?: string;
  documents?: Array<{ title: string; url: string; type: string; uploadedAt: string }>;
  coursesOffered?: Array<{
    name: string;
    degreeLevel: string;
    department?: string;
    durationYears?: number;
    tuitionFeePerYear?: number;
    seats?: number;
  }>;
  submittedBy: string;
  status?: InstitutionApplicationStatus;
}

export async function syncCollegeToCatalog(
  app: InstitutionApplication
): Promise<string | undefined> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return undefined;

  try {
    const slug = app.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const collegePayload = {
      name: app.name,
      slug,
      code: app.code,
      college_type: app.collegeType,
      category: app.category,
      state: app.state,
      city: app.city,
      website: app.website || null,
      established_year: app.establishedYear || null,
      accreditation: app.accreditation || null,
      nirf_ranking: app.nirfRanking || null,
      logo_url: app.logoUrl || null,
      banner_url: app.bannerUrl || null,
      description: app.description || `${app.name} accredited institution located in ${app.city}, ${app.state}.`,
      features: ['NIRF Accredited', 'Verified Faculty', 'Modern Campus Infrastructure'],
      is_verified: true,
    };

    let createdCollegeId = app.collegeId;

    if (createdCollegeId) {
      await supabase.from('colleges').update(collegePayload).eq('id', createdCollegeId);
    } else {
      const { data: existing } = await supabase
        .from('colleges')
        .select('id')
        .or(`slug.eq.${slug},code.eq.${app.code}`)
        .maybeSingle();

      if (existing) {
        createdCollegeId = existing.id;
        await supabase.from('colleges').update(collegePayload).eq('id', createdCollegeId);
      } else {
        const { data: newCollege, error: insertErr } = await supabase
          .from('colleges')
          .insert(collegePayload)
          .select('id')
          .single();

        if (insertErr) {
          console.warn('Error inserting into colleges table:', insertErr);
        }

        if (newCollege) {
          createdCollegeId = newCollege.id;

          // Insert college contact info
          await supabase.from('college_contacts').insert({
            college_id: newCollege.id,
            email: app.email,
            phone: app.phone,
            admission_helpline: app.phone,
            address: app.address || `${app.city}, ${app.state}`,
            city: app.city,
            state: app.state,
            pincode: '000000',
          });

          // Insert courses if submitted
          if (app.coursesOffered && app.coursesOffered.length > 0) {
            for (const c of app.coursesOffered) {
              await supabase.from('courses').insert({
                college_id: newCollege.id,
                name: c.name,
                degree_level: c.degreeLevel || 'Undergraduate',
                department: c.department || 'General',
                duration_years: c.durationYears || 4,
                eligibility: '10+2 with minimum required percentage',
                seats: c.seats || 60,
                tuition_fee_per_year: c.tuitionFeePerYear || 100000,
                currency: 'INR',
              });
            }
          }
        }
      }
    }

    return createdCollegeId;
  } catch (err) {
    console.warn('Failed to sync college to catalog:', err);
    return undefined;
  }
}

export async function submitInstitutionApplication(
  input: SubmitInstitutionInput
): Promise<InstitutionApplication> {
  const now = new Date().toISOString();
  const id = `inst_app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const status = input.status || 'submitted';

  const newApp: InstitutionApplication = {
    id,
    name: input.name,
    code: input.code.toUpperCase(),
    collegeType: input.collegeType,
    category: input.category,
    affiliation: input.affiliation,
    establishedYear: input.establishedYear,
    state: input.state,
    city: input.city,
    address: input.address,
    website: input.website,
    email: input.email,
    phone: input.phone,
    description: input.description,
    accreditation: input.accreditation,
    nirfRanking: input.nirfRanking,
    logoUrl: input.logoUrl,
    bannerUrl: input.bannerUrl,
    documents: input.documents || [],
    coursesOffered: input.coursesOffered || [],
    status,
    submittedBy: input.submittedBy,
    createdAt: now,
    updatedAt: now,
  };

  // If added with approved status, immediately sync into the master colleges catalog
  if (status === 'approved') {
    const syncedCollegeId = await syncCollegeToCatalog(newApp);
    if (syncedCollegeId) {
      newApp.collegeId = syncedCollegeId;
    }
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('institution_applications')
        .insert({
          name: input.name,
          code: input.code.toUpperCase(),
          college_type: input.collegeType,
          college_id: newApp.collegeId || null,
          category: input.category,
          affiliation: input.affiliation || null,
          established_year: input.establishedYear || null,
          state: input.state,
          city: input.city,
          address: input.address || null,
          website: input.website || null,
          email: input.email,
          phone: input.phone,
          description: input.description || null,
          accreditation: input.accreditation || null,
          nirf_ranking: input.nirfRanking || null,
          logo_url: input.logoUrl || null,
          banner_url: input.bannerUrl || null,
          documents: input.documents || [],
          courses_offered: input.coursesOffered || [],
          status,
          submitted_by: input.submittedBy,
        })
        .select()
        .single();

      if (!error && data) {
        newApp.id = data.id;
      }
    } catch {
      // In-memory fallback
    }
  }

  inMemoryApplications.unshift(newApp);

  await logAdminAction({
    userId: input.submittedBy,
    role: 'institution_admin',
    action: 'institution_application_submitted',
    targetEntity: 'institution_application',
    targetId: newApp.id,
    newState: { name: newApp.name, code: newApp.code, status },
    metadata: { state: newApp.state, city: newApp.city },
  });

  return newApp;
}

export async function getInstitutionApplications(params?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: InstitutionApplication[]; total: number }> {
  const limit = params?.limit || 50;
  const offset = params?.offset || 0;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      let query = supabase
        .from('institution_applications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (params?.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }
      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
      }

      const { data, count, error } = await query;
      if (!error && data) {
        return {
          data: data.map(mapDatabaseInstApp),
          total: count || data.length,
        };
      }
    } catch {
      // In-memory fallback
    }
  }

  let filtered = [...inMemoryApplications];
  if (params?.status && params.status !== 'all') {
    filtered = filtered.filter((a) => a.status === params.status);
  }
  if (params?.search) {
    const s = params.search.toLowerCase();
    filtered = filtered.filter((a) => a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s));
  }

  return {
    data: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}

export async function getInstitutionApplicationById(id: string): Promise<InstitutionApplication | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('institution_applications')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapDatabaseInstApp(data);
      }
    } catch {
      // In-memory fallback
    }
  }

  return inMemoryApplications.find((a) => a.id === id) || null;
}

export interface ReviewApplicationInput {
  status: InstitutionApplicationStatus;
  reviewNotes?: string;
  rejectionReason?: string;
  reviewerUid: string;
  reviewerEmail?: string;
}

export async function reviewInstitutionApplication(
  id: string,
  review: ReviewApplicationInput
): Promise<InstitutionApplication | null> {
  const app = await getInstitutionApplicationById(id);
  if (!app) return null;

  const previousState = { status: app.status, reviewNotes: app.reviewNotes };
  const now = new Date().toISOString();
  let createdCollegeId = app.collegeId;

  const supabase = getSupabaseAdmin();

  // If approved, create or update master `colleges` directory so students can view it!
  if (review.status === 'approved') {
    const synced = await syncCollegeToCatalog(app);
    if (synced) createdCollegeId = synced;
  } else if (review.status === 'suspended' && createdCollegeId && supabase) {
    try {
      await supabase.from('colleges').update({ is_verified: false }).eq('id', createdCollegeId);
    } catch {
      // Ignore
    }
  }

  // Update application record
  app.status = review.status;
  app.reviewNotes = review.reviewNotes;
  app.rejectionReason = review.rejectionReason;
  app.reviewedBy = review.reviewerUid;
  app.reviewedAt = now;
  app.collegeId = createdCollegeId;
  app.updatedAt = now;

  if (supabase) {
    try {
      await supabase
        .from('institution_applications')
        .update({
          status: review.status,
          review_notes: review.reviewNotes || null,
          rejection_reason: review.rejectionReason || null,
          reviewed_by: review.reviewerUid,
          reviewed_at: now,
          college_id: createdCollegeId || null,
        })
        .eq('id', id);
    } catch {
      // In-memory fallback
    }
  }

  await logAdminAction({
    userId: review.reviewerUid,
    email: review.reviewerEmail,
    role: 'admin',
    action: `institution_${review.status}`,
    targetEntity: 'institution_application',
    targetId: app.id,
    previousState,
    newState: { status: review.status, notes: review.reviewNotes, collegeId: createdCollegeId },
    metadata: { institutionName: app.name, institutionCode: app.code },
  });

  return app;
}
