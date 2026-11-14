import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  ApplicationStatus,
  ApplicationTimelineEvent,
  CollegeApplication,
} from '@/types';
import { mapDatabaseCollege, getCollegeById } from '@/services/colleges';
import { logStudentActivity } from '@/services/activityLogs';

// In-memory store for development/preview when database tables are being provisioned
const inMemoryApplications = new Map<string, CollegeApplication[]>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabaseApplication(row: any): CollegeApplication {
  const timeline: ApplicationTimelineEvent[] = Array.isArray(row.application_timeline)
    ? row.application_timeline.map((t: any) => ({
        id: t.id,
        applicationId: t.application_id,
        status: t.status,
        title: t.title,
        description: t.description,
        createdAt: t.created_at,
      }))
    : [];

  return {
    id: row.id,
    userId: row.user_id,
    collegeId: row.college_id,
    courseId: row.course_id || undefined,
    applicationNumber: row.application_number,
    status: row.status as ApplicationStatus,
    applicantName: row.applicant_name,
    applicantEmail: row.applicant_email,
    applicantPhone: row.applicant_phone || undefined,
    category: row.category || 'General',
    quota: row.quota || 'All India',
    examName: row.exam_name || undefined,
    scoreOrRank: row.score_or_rank != null ? Number(row.score_or_rank) : undefined,
    academicYear: row.academic_year || '2026-2027',
    statementOfPurpose: row.statement_of_purpose || undefined,
    notes: row.notes || undefined,
    submittedAt: row.submitted_at || undefined,
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
    timeline,
  };
}

export interface CreateApplicationInput {
  userId: string;
  collegeId: string;
  courseId?: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  category?: string;
  quota?: string;
  examName?: string;
  scoreOrRank?: number;
  academicYear?: string;
  statementOfPurpose?: string;
  notes?: string;
  asDraft?: boolean;
}

export async function createCollegeApplication(input: CreateApplicationInput): Promise<CollegeApplication> {
  const college = await getCollegeById(input.collegeId);
  const now = new Date().toISOString();
  const status: ApplicationStatus = input.asDraft ? 'draft' : 'submitted';
  const appNumber = `APP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

  const newApp: CollegeApplication = {
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: input.userId,
    collegeId: input.collegeId,
    courseId: input.courseId,
    applicationNumber: appNumber,
    status,
    applicantName: input.applicantName,
    applicantEmail: input.applicantEmail,
    applicantPhone: input.applicantPhone,
    category: input.category || 'General',
    quota: input.quota || 'All India',
    examName: input.examName,
    scoreOrRank: input.scoreOrRank,
    academicYear: input.academicYear || '2026-2027',
    statementOfPurpose: input.statementOfPurpose,
    notes: input.notes,
    submittedAt: input.asDraft ? undefined : now,
    createdAt: now,
    updatedAt: now,
    college: college || undefined,
    timeline: [
      {
        id: `tl_${Date.now()}_1`,
        applicationId: '',
        status,
        title: input.asDraft ? 'Application Draft Saved' : 'Application Submitted to Institution',
        description: input.asDraft
          ? 'Draft application initiated and saved for review.'
          : `Formal admission dossier submitted with Application #${appNumber}.`,
        createdAt: now,
      },
    ],
  };

  // 1. Attempt database persistence
  const supabase = getSupabaseAdmin() || getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: dbApp, error: appError } = await supabase
        .from('college_applications')
        .insert({
          user_id: input.userId,
          college_id: input.collegeId,
          course_id: input.courseId || null,
          application_number: appNumber,
          status,
          applicant_name: input.applicantName,
          applicant_email: input.applicantEmail,
          applicant_phone: input.applicantPhone || null,
          category: input.category || 'General',
          quota: input.quota || 'All India',
          exam_name: input.examName || null,
          score_or_rank: input.scoreOrRank || null,
          academic_year: input.academicYear || '2026-2027',
          statement_of_purpose: input.statementOfPurpose || null,
          notes: input.notes || null,
          submitted_at: input.asDraft ? null : now,
        })
        .select()
        .single();

      if (!appError && dbApp) {
        newApp.id = dbApp.id;

        // Insert timeline event
        await supabase.from('application_timeline').insert({
          application_id: dbApp.id,
          status,
          title: newApp.timeline![0].title,
          description: newApp.timeline![0].description,
        });

        newApp.timeline![0].applicationId = dbApp.id;
      }
    } catch {
      // In-memory fallback
    }
  }

  // 2. Cache in in-memory map
  const userApps = inMemoryApplications.get(input.userId) || [];
  userApps.unshift(newApp);
  inMemoryApplications.set(input.userId, userApps);

  // 3. Log student audit activity
  await logStudentActivity({
    userId: input.userId,
    activityType: input.asDraft ? 'application_created' : 'application_submitted',
    title: input.asDraft ? 'Saved Application Draft' : 'Submitted College Application',
    description: `Application #${appNumber} for ${college?.name || 'Institution'}.`,
    metadata: {
      applicationId: newApp.id,
      applicationNumber: appNumber,
      collegeId: input.collegeId,
      collegeName: college?.name,
      status,
    },
  });

  return newApp;
}

export async function getStudentApplications(userId: string): Promise<CollegeApplication[]> {
  const supabase = getSupabaseAdmin() || getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('college_applications')
        .select('*, colleges(*), courses(*), application_timeline(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(mapDatabaseApplication);
      }
    } catch {
      // Fallback to in-memory store
    }
  }

  return inMemoryApplications.get(userId) || [];
}

export async function getApplicationById(applicationId: string, userId: string): Promise<CollegeApplication | null> {
  const supabase = getSupabaseAdmin() || getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('college_applications')
        .select('*, colleges(*), courses(*), application_timeline(*)')
        .eq('id', applicationId)
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        return mapDatabaseApplication(data);
      }
    } catch {
      // Fallback to in-memory check
    }
  }

  const userApps = inMemoryApplications.get(userId) || [];
  return userApps.find((a) => a.id === applicationId) || null;
}

export async function withdrawCollegeApplication(
  applicationId: string,
  userId: string,
  reason?: string
): Promise<CollegeApplication | null> {
  const app = await getApplicationById(applicationId, userId);
  if (!app) return null;

  if (app.status === 'withdrawn' || app.status === 'admitted') {
    return app;
  }

  const now = new Date().toISOString();
  const title = 'Application Withdrawn by Candidate';
  const description = reason || 'Candidate opted to withdraw this admission dossier.';

  const supabase = getSupabaseAdmin() || getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('college_applications')
        .update({ status: 'withdrawn', updated_at: now })
        .eq('id', applicationId)
        .eq('user_id', userId);

      await supabase.from('application_timeline').insert({
        application_id: applicationId,
        status: 'withdrawn',
        title,
        description,
      });
    } catch {
      // Fallback
    }
  }

  // Update in-memory
  app.status = 'withdrawn';
  app.updatedAt = now;
  app.timeline = app.timeline || [];
  app.timeline.unshift({
    id: `tl_${Date.now()}`,
    applicationId,
    status: 'withdrawn',
    title,
    description,
    createdAt: now,
  });

  // Log audit
  await logStudentActivity({
    userId,
    activityType: 'application_withdrawn',
    title: 'Application Withdrawn',
    description: `Withdrew Application #${app.applicationNumber} for ${app.college?.name || 'Institution'}.`,
    metadata: { applicationId, reason },
  });

  return app;
}
