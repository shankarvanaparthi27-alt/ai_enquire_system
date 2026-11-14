import { NextRequest, NextResponse } from 'next/server';
import { searchColleges } from '@/services/colleges';
import { CollegeSearchParams } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const params: CollegeSearchParams = {
      query: searchParams.get('q') || undefined,
      location: searchParams.get('location') || undefined,
      collegeType: searchParams.get('collegeType') || undefined,
      category: searchParams.get('category') || undefined,
      courseCategory: searchParams.get('courseCategory') || undefined,
      maxFee: searchParams.get('maxFee') ? Number(searchParams.get('maxFee')) : undefined,
      minRating: searchParams.get('minRating') ? Number(searchParams.get('minRating')) : undefined,
      sortBy: (searchParams.get('sortBy') as CollegeSearchParams['sortBy']) || 'rating',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 8,
    };

    const results = await searchColleges(params);

    return NextResponse.json({
      success: true,
      data: results,
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_')) {
      throw err;
    }
    console.error('API Colleges error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to search colleges' },
      { status: 500 }
    );
  }
}
