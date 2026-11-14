import { getVerifiedCutoffs } from '@/services/cutoffs';
import { generateContent } from '@/lib/gemini/client';
import {
  AdmissionChance,
  CutoffRank,
  PredictionItem,
  PredictorInput,
  SupportedLanguage,
} from '@/types';

/**
 * Deterministic admission calculation based on verified institutional cutoff data
 */
export async function evaluateAdmissionEligibility(
  input: PredictorInput,
  language: SupportedLanguage = 'en'
): Promise<{
  predictions: PredictionItem[];
  counselingSummary: string;
}> {
  // 1. Fetch verified cutoff records matching exam, category, and quota
  const verifiedCutoffs = await getVerifiedCutoffs({
    examName: input.examName,
    category: input.category,
    quota: input.quota,
  });

  const predictions: PredictionItem[] = [];

  // Group cutoffs by college and course
  for (const cutoff of verifiedCutoffs) {
    if (!cutoff.college) continue;

    // Optional stream/degree filter
    if (input.targetDegree && input.targetDegree !== 'all') {
      const courseDegree = cutoff.course?.degreeLevel?.toLowerCase() || '';
      if (!courseDegree.includes(input.targetDegree.toLowerCase())) {
        continue;
      }
    }

    if (input.preferredState && input.preferredState !== 'all') {
      if (cutoff.college.state.toLowerCase() !== input.preferredState.toLowerCase()) {
        continue;
      }
    }

    let chance: AdmissionChance = 'Insufficient data';
    let explanation = '';
    let rankDiff: number | undefined;

    // Exam-specific statutory eligibility checks (Official counseling regulatory rules)
    const examLower = input.examName.toLowerCase();
    let isStatutorilyIneligible = false;
    let statutoryReason = '';

    if (input.class12Percentage != null) {
      if (examLower.includes('jee')) {
        // JoSAA / CSAB rule: 75% for General/OBC/EWS, 65% for SC/ST
        const minReq = input.category === 'SC' || input.category === 'ST' ? 65 : 75;
        if (input.class12Percentage < minReq) {
          isStatutorilyIneligible = true;
          statutoryReason = `Class 12th aggregate (${input.class12Percentage}%) does not meet the statutory JoSAA/CSAB minimum of ${minReq}% for ${input.category} category.`;
        }
      } else if (examLower.includes('neet')) {
        // NMC / MCC rule: 50% for General/EWS, 40% for SC/ST/OBC in PCB
        const minReq = input.category === 'General' || input.category === 'EWS' ? 50 : 40;
        if (input.class12Percentage < minReq) {
          isStatutorilyIneligible = true;
          statutoryReason = `Class 12th aggregate (${input.class12Percentage}%) does not meet the NMC statutory requirement of ${minReq}% in PCB for ${input.category} category.`;
        }
      } else if (examLower.includes('bitsat')) {
        // BITS Pilani rule: 75% aggregate in PCM/PCB
        if (input.class12Percentage < 75) {
          isStatutorilyIneligible = true;
          statutoryReason = `Class 12th aggregate (${input.class12Percentage}%) is below BITS Pilani statutory requirement of 75% aggregate in PCM/PCB.`;
        }
      }
      // For Post-Graduate examinations (CAT, GATE), Class 12% is not a statutory disqualifier
    }

    if (isStatutorilyIneligible) {
      chance = 'Ineligible';
      explanation = statutoryReason;
    } else if (cutoff.cutoffType === 'rank' && cutoff.closingRank != null) {
      // Rank model: lower numerical rank is superior
      rankDiff = cutoff.closingRank - input.scoreOrRank;
      if (input.scoreOrRank <= cutoff.closingRank * 0.9) {
        chance = 'High';
        explanation = `Your rank (${input.scoreOrRank}) comfortably satisfies the verified closing rank benchmark (${cutoff.closingRank}) by ${rankDiff} positions.`;
      } else if (input.scoreOrRank <= cutoff.closingRank * 1.08) {
        chance = 'Moderate';
        explanation = `Your rank (${input.scoreOrRank}) is within close range of the verified closing rank (${cutoff.closingRank}). May require subsequent counseling rounds.`;
      } else {
        chance = 'Low';
        explanation = `Your rank (${input.scoreOrRank}) is beyond the verified cutoff closing rank (${cutoff.closingRank}) by ${Math.abs(rankDiff)} positions.`;
      }
    } else if (cutoff.cutoffType === 'percentile' && cutoff.minPercentile != null) {
      // Percentile model: higher numerical value is superior
      const diff = input.scoreOrRank - cutoff.minPercentile;
      if (input.scoreOrRank >= cutoff.minPercentile + 2) {
        chance = 'High';
        explanation = `Your percentile (${input.scoreOrRank}) exceeds the minimum verified percentile (${cutoff.minPercentile}) by ${diff.toFixed(2)} points.`;
      } else if (input.scoreOrRank >= cutoff.minPercentile - 2) {
        chance = 'Moderate';
        explanation = `Your percentile (${input.scoreOrRank}) is on the boundary of the verified cutoff percentile (${cutoff.minPercentile}).`;
      } else {
        chance = 'Low';
        explanation = `Your percentile (${input.scoreOrRank}) is below the verified cutoff requirement (${cutoff.minPercentile}).`;
      }
    } else if (cutoff.cutoffType === 'score' && cutoff.minScore != null) {
      // Score model: higher numerical score is superior
      const diff = input.scoreOrRank - cutoff.minScore;
      if (input.scoreOrRank >= cutoff.minScore + 15) {
        chance = 'High';
        explanation = `Your score (${input.scoreOrRank}) safely surpasses the verified minimum score threshold (${cutoff.minScore}).`;
      } else if (input.scoreOrRank >= cutoff.minScore - 15) {
        chance = 'Moderate';
        explanation = `Your score (${input.scoreOrRank}) is competitive and near the minimum benchmark (${cutoff.minScore}).`;
      } else {
        chance = 'Low';
        explanation = `Your score (${input.scoreOrRank}) is under the verified minimum score threshold (${cutoff.minScore}).`;
      }
    } else {
      chance = 'Insufficient data';
      explanation = 'Verified cutoff statistics are not available for this program round.';
    }

    predictions.push({
      collegeId: cutoff.collegeId,
      collegeName: cutoff.college.name,
      collegeSlug: cutoff.college.slug,
      courseId: cutoff.courseId,
      courseName: cutoff.course?.name || 'General Program',
      degreeLevel: cutoff.course?.degreeLevel || 'Undergraduate',
      chance,
      cutoffType: cutoff.cutoffType,
      closingRank: cutoff.closingRank,
      minPercentile: cutoff.minPercentile,
      minScore: cutoff.minScore,
      rankDifference: rankDiff,
      academicYear: cutoff.academicYear,
      category: cutoff.category,
      quota: cutoff.quota,
      tuitionFeePerYear: cutoff.course?.tuitionFeePerYear || cutoff.college.minFeePerYear,
      explanation,
    });
  }

  // 2. Generate Gemini Multilingual Counseling Summary
  let counselingSummary = '';
  try {
    const languageNames: Record<SupportedLanguage, string> = {
      en: 'English',
      te: 'Telugu',
      hi: 'Hindi',
      ta: 'Tamil',
      kn: 'Kannada',
      pa: 'Punjabi',
    };

    const targetLang = languageNames[language] || 'English';

    const highCount = predictions.filter((p) => p.chance === 'High').length;
    const modCount = predictions.filter((p) => p.chance === 'Moderate').length;
    const lowCount = predictions.filter((p) => p.chance === 'Low').length;

    const prompt = `
You are an expert AI College Admissions Counselor in India. Provide a concise, highly realistic 3-4 sentence counseling summary for a student based strictly on the following deterministic evaluation:
- Exam: ${input.examName}
- Score/Rank: ${input.scoreOrRank}
- Category: ${input.category}
- Quota: ${input.quota}
- 12th Percentage: ${input.class12Percentage ?? 'Not provided'}
- Evaluated Matches: ${predictions.length} institutions (${highCount} High chance, ${modCount} Moderate, ${lowCount} Low).

Respond in ${targetLang}. Never fabricate numerical cutoffs or college data. Give practical advice on choice filling and counseling rounds. Explicitly emphasize that these results represent historical competitiveness benchmarks from prior counseling rounds, not guaranteed seat allocations. Keep it clear, professional, and encouraging.
    `.trim();

    counselingSummary = await generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      temperature: 0.3,
      maxOutputTokens: 500,
    });
  } catch (err) {
    console.warn('Gemini counseling summary generation failed:', err);
    counselingSummary = `Based on your ${input.examName} performance (${input.scoreOrRank}), your profile matches ${predictions.length} verified institution options. Note: These evaluations reflect historical competitiveness estimates from prior counseling rounds and do not guarantee future seat allocation. Prioritize colleges carefully during JoSAA/State counseling choice filling.`;
  }

  return {
    predictions,
    counselingSummary,
  };
}
