import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/serverAuth';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { evaluateAdmissionEligibility } from '@/services/predictor';
import { PredictorInput, SupportedLanguage } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      examName,
      scoreOrRank,
      category = 'General',
      quota = 'All India',
      targetDegree = 'Undergraduate',
      targetStream,
      class12Percentage,
      preferredState,
      language = 'en',
    } = body;

    if (!examName || scoreOrRank == null || isNaN(Number(scoreOrRank))) {
      return NextResponse.json(
        { success: false, error: 'Valid entrance exam and score/rank are required.' },
        { status: 400 }
      );
    }

    const input: PredictorInput = {
      examName: examName.trim(),
      scoreOrRank: Number(scoreOrRank),
      category: category.trim(),
      quota: quota.trim(),
      targetDegree: targetDegree.trim(),
      targetStream: targetStream?.trim() || undefined,
      class12Percentage:
        class12Percentage != null ? Number(class12Percentage) : undefined,
      preferredState: preferredState?.trim() || undefined,
    };

    const evaluation = await evaluateAdmissionEligibility(
      input,
      (language as SupportedLanguage) || 'en'
    );

    // Optional: If user is authenticated, record prediction history
    const user = await authenticateRequest(req);
    const supabase = getSupabaseAdmin();
    let savedId: string | undefined;

    if (user && supabase) {
      try {
        const { data: record } = await supabase
          .from('predictor_results')
          .insert({
            user_id: user.uid,
            exam_name: input.examName,
            score_or_rank: input.scoreOrRank,
            category: input.category,
            quota: input.quota,
            target_degree: input.targetDegree,
            target_stream: input.targetStream || null,
            class_12_percentage: input.class12Percentage || null,
            predictions: evaluation.predictions,
          })
          .select('id')
          .single();

        if (record) savedId = record.id;
      } catch (saveErr) {
        console.warn('Could not save predictor history:', saveErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: savedId,
        predictions: evaluation.predictions,
        counselingSummary: evaluation.counselingSummary,
        input,
      },
    });
  } catch (err: unknown) {
    console.error('API /api/predictor/predict error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
