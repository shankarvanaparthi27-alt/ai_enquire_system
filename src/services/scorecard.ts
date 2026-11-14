import { getStudentProfile } from '@/services/profiles';
import { getFavouriteColleges } from '@/services/favourites';
import { getStudentApplications } from '@/services/applications';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import {
  College,
  CollegeApplication,
  EligibilityScorecard,
  PredictionItem,
  PredictorResult,
} from '@/types';

export async function getStudentPredictorHistory(userId: string): Promise<PredictorResult[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('predictor_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error || !data) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      examName: row.exam_name,
      scoreOrRank: Number(row.score_or_rank),
      category: row.category,
      quota: row.quota,
      targetDegree: row.target_degree,
      targetStream: row.target_stream || undefined,
      class12Percentage:
        row.class_12_percentage != null ? Number(row.class_12_percentage) : undefined,
      predictions: (Array.isArray(row.predictions) ? row.predictions : []) as PredictionItem[],
      createdAt: row.created_at,
    }));
  } catch {
    return [];
  }
}

export async function generateStudentScorecard(userId: string): Promise<EligibilityScorecard> {
  const [profile, predictionsHistory, favourites, applications] = await Promise.all([
    getStudentProfile(userId),
    getStudentPredictorHistory(userId),
    getFavouriteColleges(userId),
    getStudentApplications(userId),
  ]);

  const latestPrediction: PredictorResult | null =
    predictionsHistory.length > 0 ? predictionsHistory[0] : null;

  const predictions: PredictionItem[] = latestPrediction?.predictions || [];
  const highChanceCount = predictions.filter((p: PredictionItem) => p.chance === 'High').length;
  const moderateChanceCount = predictions.filter((p: PredictionItem) => p.chance === 'Moderate').length;
  const lowChanceCount = predictions.filter((p: PredictionItem) => p.chance === 'Low').length;

  const scorecard: EligibilityScorecard = {
    generatedAt: new Date().toISOString(),
    student: {
      fullName: profile?.fullName || 'Student Applicant',
      email: profile?.email || '',
      phone: profile?.phone,
      city: profile?.city,
      state: profile?.state,
      targetDegree: profile?.targetDegree,
    },
    academicProfile: {
      examName: latestPrediction?.examName,
      scoreOrRank: latestPrediction?.scoreOrRank,
      category: latestPrediction?.category,
      quota: latestPrediction?.quota,
      class12Percentage: latestPrediction?.class12Percentage,
    },
    summary: {
      totalEvaluated: predictions.length,
      highChanceCount,
      moderateChanceCount,
      lowChanceCount,
    },
    predictions,
    shortlistedColleges: favourites.map((c: College) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      state: c.state,
      nirfRanking: c.nirfRanking,
      category: c.category,
    })),
    activeApplications: applications.map((a: CollegeApplication) => ({
      applicationNumber: a.applicationNumber,
      collegeName: a.college?.name || 'Institution',
      courseName: a.course?.name,
      status: a.status,
      appliedAt: a.submittedAt || a.createdAt,
    })),
  };

  return scorecard;
}
