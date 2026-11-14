import { getSupabaseAdmin } from '@/lib/supabase/server';
import { UserRole } from '@/types';
import { logAdminAction } from './audit';
import { setFirebaseUserCustomClaims } from '@/lib/firebase/admin';

export interface StudentPerformanceData {
  readinessScore: number;
  performanceTier: 'Elite Aspirant' | 'Strong Performer' | 'Active Explorer' | 'Early Stage';
  tierColor: 'emerald' | 'cyan' | 'amber' | 'slate';
  profileCompletion: number;
  primaryExam?: string;
  examScoreOrRank?: number;
  class12Percentage?: number;
  category?: string;
  quota?: string;
  targetDegree?: string;
  shortlistedCollegesCount: number;
  predictionsRunCount: number;
  documentsUploadedCount: number;
  summary: string;
  keyStrengths: string[];
  recommendations: string[];
  lastActive?: string;
}

export interface PlatformUserView {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  collegeId?: string;
  createdAt: string;
  phone?: string;
  city?: string;
  state?: string;
  avatarUrl?: string;
  targetDegree?: string;
  performance: StudentPerformanceData;
}

export async function getPlatformUsers(params?: {
  role?: string;
  search?: string;
  limit?: number;
}): Promise<PlatformUserView[]> {
  const limit = params?.limit || 50;
  const supabase = getSupabaseAdmin();
  const users: PlatformUserView[] = [];

  const SUPER_ADMIN_EMAILS = [
    'vanaparthishankar27@gmail.com',
    'gowrishankarvanaparthi@gmail.com',
    process.env.SUPER_ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL,
  ].filter(Boolean).map((e) => (e as string).toLowerCase());

  if (supabase) {
    try {
      // 1. Fetch profiles
      let profQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (params?.search) {
        profQuery = profQuery.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }

      const { data: profiles } = await profQuery;

      // 2. Fetch predictor results
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let predictions: any[] = [];
      try {
        const { data: prData } = await supabase
          .from('predictor_results')
          .select('*')
          .order('created_at', { ascending: false });
        if (prData) predictions = prData;
      } catch {
        // Ignore
      }

      // 3. Fetch favourite shortlisted colleges
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let favourites: any[] = [];
      try {
        const { data: fData } = await supabase.from('favourite_colleges').select('*');
        if (fData) favourites = fData;
      } catch {
        // Ignore
      }

      // 4. Fetch student documents
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let documents: any[] = [];
      try {
        const { data: docData } = await supabase.from('student_documents').select('*');
        if (docData) documents = docData;
      } catch {
        // Ignore
      }

      // 5. Fetch admin roles
      const roleMap = new Map<string, { role: UserRole; collegeId?: string }>();
      try {
        const { data: roles, error: rErr } = await supabase
          .from('admin_roles')
          .select('*')
          .eq('is_active', true);
        if (!rErr && roles) {
          for (const r of roles) {
            roleMap.set(r.user_id, {
              role: r.role as UserRole,
              collegeId: r.college_id || undefined,
            });
          }
        }
      } catch {
        // Ignore
      }

      if (profiles && profiles.length > 0) {
        for (const p of profiles) {
          let role: UserRole = roleMap.get(p.firebase_uid)?.role || 'student';
          if (p.email && SUPER_ADMIN_EMAILS.includes(p.email.toLowerCase())) {
            role = 'super_admin';
          }
          const collegeId = roleMap.get(p.firebase_uid)?.collegeId;

          // Compute user performance from linked Supabase tables
          const userPreds = predictions.filter((pr) => pr.user_id === p.firebase_uid);
          const userFavs = favourites.filter((f) => f.user_id === p.firebase_uid);
          const userDocs = documents.filter((d) => d.user_id === p.firebase_uid);

          const latestPred = userPreds.length > 0 ? userPreds[0] : null;

          // Profile completion calculation (0 - 100%)
          let profileCompletion = 0;
          if (p.full_name) profileCompletion += 20;
          if (p.email) profileCompletion += 15;
          if (p.phone) profileCompletion += 15;
          if (p.city || p.state) profileCompletion += 15;
          if (p.target_degree) profileCompletion += 15;
          if (latestPred) profileCompletion += 20;
          profileCompletion = Math.min(profileCompletion, 100);

          // Academic Readiness Score (0 - 100)
          let readinessScore = Math.round(profileCompletion * 0.35); // 0-35 pts
          if (latestPred) {
            readinessScore += 35; // Verified entrance examination score submitted
            if (latestPred.class_12_percentage && latestPred.class_12_percentage >= 75) {
              readinessScore += 10; // Meets statutory JoSAA 75% standard
            }
          }
          readinessScore += Math.min(userFavs.length * 10, 20); // up to 20 pts for shortlist

          readinessScore = Math.min(Math.max(readinessScore, 15), 100);

          let performanceTier: 'Elite Aspirant' | 'Strong Performer' | 'Active Explorer' | 'Early Stage' = 'Early Stage';
          let tierColor: 'emerald' | 'cyan' | 'amber' | 'slate' = 'slate';

          if (readinessScore >= 80) {
            performanceTier = 'Elite Aspirant';
            tierColor = 'emerald';
          } else if (readinessScore >= 60) {
            performanceTier = 'Strong Performer';
            tierColor = 'cyan';
          } else if (readinessScore >= 40) {
            performanceTier = 'Active Explorer';
            tierColor = 'amber';
          }

          const keyStrengths: string[] = [];
          const recommendations: string[] = [];

          if (latestPred) {
            keyStrengths.push(`${latestPred.exam_name}: Rank/Score ${latestPred.score_or_rank}`);
            if (latestPred.class_12_percentage) {
              keyStrengths.push(`${latestPred.class_12_percentage}% in 12th Board examinations`);
            }
          }
          if (userFavs.length > 0) {
            keyStrengths.push(`${userFavs.length} accredited institution(s) shortlisted in Vault`);
          }
          if (p.target_degree) {
            keyStrengths.push(`Declared path: ${p.target_degree}`);
          }
          if (keyStrengths.length === 0) {
            keyStrengths.push('Registered student on UniVerse AI platform');
          }

          if (!latestPred) {
            recommendations.push('Run Admission Predictor with JEE/NEET/Board scores');
          } else {
            recommendations.push('Review JoSAA / CSAB counseling iterations for shortlisted options');
          }
          if (userFavs.length === 0) {
            recommendations.push('Shortlist 3-5 target institutions in Explore Colleges');
          }
          if (profileCompletion < 80) {
            recommendations.push('Complete target degree and location preferences in Profile');
          }

          const summary = latestPred
            ? `Top candidate for ${p.target_degree || 'Higher Education'} with ${latestPred.exam_name} Score/Rank ${latestPred.score_or_rank}. ${userFavs.length} colleges saved.`
            : userFavs.length > 0
            ? `Active applicant with ${userFavs.length} shortlisted institutions in ${p.target_degree || 'degree program'}.`
            : `Newly onboarded applicant exploring university programs.`;

          if (!params?.role || params.role === 'all' || role === params.role) {
            users.push({
              userId: p.firebase_uid,
              email: p.email,
              fullName: p.full_name || 'Student',
              role,
              collegeId,
              createdAt: p.created_at,
              phone: p.phone || undefined,
              city: p.city || undefined,
              state: p.state || undefined,
              avatarUrl: p.avatar_url || undefined,
              targetDegree: p.target_degree || undefined,
              performance: {
                readinessScore,
                performanceTier,
                tierColor,
                profileCompletion,
                primaryExam: latestPred?.exam_name,
                examScoreOrRank: latestPred?.score_or_rank != null ? Number(latestPred.score_or_rank) : undefined,
                class12Percentage: latestPred?.class_12_percentage != null ? Number(latestPred.class_12_percentage) : undefined,
                category: latestPred?.category || 'General',
                quota: latestPred?.quota || 'All India',
                targetDegree: p.target_degree || latestPred?.target_degree || 'Undergraduate',
                shortlistedCollegesCount: userFavs.length,
                predictionsRunCount: userPreds.length,
                documentsUploadedCount: userDocs.length,
                summary,
                keyStrengths,
                recommendations,
                lastActive: latestPred?.created_at || p.created_at,
              },
            });
          }
        }
      }
    } catch {
      // In-memory fallback
    }
  }

  if (users.length === 0) {
    const mockUsers: PlatformUserView[] = [
      {
        userId: 'super-admin-root',
        email: 'vanaparthishankar27@gmail.com',
        fullName: 'Vanaparthi Shankar (Super Admin)',
        role: 'super_admin',
        createdAt: new Date().toISOString(),
        targetDegree: 'Engineering / Technology',
        city: 'Rajahmundry',
        state: 'Andhra Pradesh',
        performance: {
          readinessScore: 98,
          performanceTier: 'Elite Aspirant',
          tierColor: 'emerald',
          profileCompletion: 100,
          primaryExam: 'JEE Advanced',
          examScoreOrRank: 850,
          class12Percentage: 85,
          category: 'General',
          quota: 'All India',
          targetDegree: 'Engineering / Technology',
          shortlistedCollegesCount: 2,
          predictionsRunCount: 3,
          documentsUploadedCount: 2,
          summary: 'Elite candidate with AIR 850 in JEE Advanced and 85% in 12th Boards.',
          keyStrengths: ['JEE Advanced AIR 850', '85% in 12th Board Examinations', 'Shortlisted Tier-1 IITs'],
          recommendations: ['Choice filling complete for JoSAA Iteration 1'],
        },
      },
      {
        userId: 'student-demo',
        email: 'student@example.edu',
        fullName: 'Demo Student',
        role: 'student',
        createdAt: new Date().toISOString(),
        targetDegree: 'Medicine',
        performance: {
          readinessScore: 65,
          performanceTier: 'Strong Performer',
          tierColor: 'cyan',
          profileCompletion: 75,
          primaryExam: 'NEET UG',
          examScoreOrRank: 620,
          shortlistedCollegesCount: 1,
          predictionsRunCount: 2,
          documentsUploadedCount: 0,
          summary: 'Strong NEET applicant with score 620/720.',
          keyStrengths: ['NEET UG: 620 score', 'Targeting Medical Colleges'],
          recommendations: ['Upload 10th & 12th certificates to Document Vault'],
        },
      },
    ];
    return mockUsers.filter((u) => !params?.role || params.role === 'all' || u.role === params.role);
  }

  return users;
}

export interface AssignRoleParams {
  targetUid: string;
  email: string;
  role: UserRole;
  collegeId?: string;
  assignedBy: string;
  assignedByEmail?: string;
}

export async function assignUserRole(params: AssignRoleParams): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  // 1. Set Firebase Custom Claims
  await setFirebaseUserCustomClaims(params.targetUid, {
    role: params.role,
    admin: params.role === 'super_admin' || params.role === 'admin',
    collegeId: params.collegeId || null,
  });

  // 2. Persist in database admin_roles if available
  if (supabase) {
    try {
      if (params.role === 'student') {
        await supabase
          .from('admin_roles')
          .update({ is_active: false })
          .eq('user_id', params.targetUid);
      } else {
        await supabase.from('admin_roles').upsert(
          {
            user_id: params.targetUid,
            email: params.email,
            role: params.role,
            college_id: params.collegeId || null,
            is_active: true,
            assigned_by: params.assignedBy,
            assigned_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }
    } catch {
      // Ignore
    }
  }

  // 3. Audit log
  await logAdminAction({
    userId: params.assignedBy,
    email: params.assignedByEmail,
    role: 'super_admin',
    action: `role_assigned_${params.role}`,
    targetEntity: 'user_account',
    targetId: params.targetUid,
    newState: { role: params.role, collegeId: params.collegeId },
    metadata: { targetEmail: params.email },
  });

  return true;
}
