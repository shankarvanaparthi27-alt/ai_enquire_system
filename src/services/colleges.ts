import { College, CollegeContact, Course, CollegeSearchParams, SearchResult } from '@/types';
import { SEED_COLLEGES } from '@/data/seedColleges';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

// Safely map both Supabase snake_case rows and in-memory camelCase objects to the College model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDatabaseCollege(row: any): College {
  const rawContacts = Array.isArray(row.college_contacts)
    ? row.college_contacts[0]
    : row.contacts || row.college_contacts;

  const contacts: CollegeContact | undefined = rawContacts
    ? {
        id: rawContacts.id || `cnt-${row.id}`,
        collegeId: rawContacts.college_id || rawContacts.collegeId || row.id,
        email: rawContacts.email || '',
        phone: rawContacts.phone || '',
        admissionHelpline: rawContacts.admission_helpline || rawContacts.admissionHelpline || rawContacts.phone || '',
        address: rawContacts.address || '',
        city: rawContacts.city || row.city || '',
        state: rawContacts.state || row.state || '',
        pincode: rawContacts.pincode || '',
      }
    : undefined;

  const rawCourses = Array.isArray(row.courses) ? row.courses : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const courses: Course[] = rawCourses.map((crs: any) => ({
    id: crs.id || `crs-${Math.random().toString(36).substring(2, 7)}`,
    collegeId: crs.college_id || crs.collegeId || row.id,
    name: crs.name || '',
    degreeLevel: crs.degree_level || crs.degreeLevel || 'Undergraduate',
    department: crs.department || '',
    durationYears: Number(crs.duration_years || crs.durationYears || 4),
    eligibility: crs.eligibility || '',
    seats: Number(crs.seats || 60),
    tuitionFeePerYear: Number(crs.tuition_fee_per_year ?? crs.tuitionFeePerYear ?? 0),
    currency: crs.currency || 'INR',
  }));

  return {
    id: row.id,
    name: row.name || '',
    slug: row.slug || '',
    code: row.code || '',
    collegeType: row.college_type || row.collegeType || 'Engineering & Technology',
    category: row.category || 'Government',
    state: row.state || '',
    city: row.city || '',
    website: row.website || '',
    establishedYear: Number(row.established_year || row.establishedYear || 2000),
    accreditation: row.accreditation || 'Recognized',
    nirfRanking: row.nirf_ranking || row.nirfRanking || undefined,
    rating: Number(row.rating || 4.5),
    reviewCount: Number(row.review_count || row.reviewCount || 0),
    logoUrl: row.logo_url || row.logoUrl,
    bannerUrl: row.banner_url || row.bannerUrl,
    description: row.description || '',
    features: Array.isArray(row.features) ? row.features : [],
    contacts,
    courses,
    minFeePerYear: Number(row.min_fee_per_year ?? row.minFeePerYear ?? 0),
    maxFeePerYear: Number(row.max_fee_per_year ?? row.maxFeePerYear ?? 0),
    isVerified: row.is_verified ?? row.isVerified ?? true,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
  };
}

export async function searchColleges(params: CollegeSearchParams): Promise<SearchResult<College>> {
  const {
    query = '',
    location = '',
    collegeType = '',
    category = '',
    courseCategory = '',
    maxFee,
    minRating,
    sortBy = 'rating',
    page = 1,
    limit = 6,
  } = params;

  // If Supabase is connected, query it with error boundary
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      let q = supabase.from('colleges').select('*, courses(*), college_contacts(*)', { count: 'exact' });

      if (query.trim()) {
        q = q.ilike('name', `%${query.trim()}%`);
      }
      if (location && location !== 'all') {
        q = q.or(`state.eq.${location},city.eq.${location}`);
      }
      if (collegeType && collegeType !== 'all') {
        q = q.eq('college_type', collegeType);
      }
      if (category && category !== 'all') {
        q = q.eq('category', category);
      }
      if (minRating) {
        q = q.gte('rating', minRating);
      }
      if (maxFee) {
        q = q.lte('min_fee_per_year', maxFee);
      }

      if (sortBy === 'rating') q = q.order('rating', { ascending: false });
      else if (sortBy === 'fee-asc') q = q.order('min_fee_per_year', { ascending: true });
      else if (sortBy === 'fee-desc') q = q.order('min_fee_per_year', { ascending: false });
      else if (sortBy === 'name-asc') q = q.order('name', { ascending: true });
      else if (sortBy === 'nirf') q = q.order('nirf_ranking', { ascending: true, nullsFirst: false });

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, count, error } = await q.range(from, to);

      if (!error && data && data.length > 0) {
        return {
          data: data.map(mapDatabaseCollege),
          total: count || data.length,
          page,
          limit,
          totalPages: Math.ceil((count || data.length) / limit),
        };
      }
    } catch (err) {
      console.warn('Falling back to structured local store:', err);
    }
  }

  // Local structured search filter implementation
  let results = [...SEED_COLLEGES];

  if (query.trim()) {
    const qLower = query.toLowerCase().trim();
    results = results.filter((c) => {
      const matchName = c.name.toLowerCase().includes(qLower);
      const matchCode = c.code.toLowerCase().includes(qLower);
      const matchCity = c.city.toLowerCase().includes(qLower);
      const matchState = c.state.toLowerCase().includes(qLower);
      const matchCourse = c.courses?.some((crs) => crs.name.toLowerCase().includes(qLower) || crs.department.toLowerCase().includes(qLower));
      return matchName || matchCode || matchCity || matchState || matchCourse;
    });
  }

  if (location && location !== 'all') {
    results = results.filter((c) => c.state === location || c.city === location);
  }

  if (collegeType && collegeType !== 'all') {
    results = results.filter((c) => c.collegeType === collegeType);
  }

  if (category && category !== 'all') {
    results = results.filter((c) => c.category === category);
  }

  if (courseCategory && courseCategory !== 'all') {
    results = results.filter((c) =>
      c.courses?.some((crs) => crs.degreeLevel === courseCategory || crs.department.toLowerCase().includes(courseCategory.toLowerCase()))
    );
  }

  if (minRating && minRating > 0) {
    results = results.filter((c) => c.rating >= minRating);
  }

  if (maxFee && maxFee > 0) {
    results = results.filter((c) => (c.minFeePerYear ?? 0) <= maxFee);
  }

  // Sorting
  results.sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'fee-asc') return (a.minFeePerYear ?? 0) - (b.minFeePerYear ?? 0);
    if (sortBy === 'fee-desc') return (b.minFeePerYear ?? 0) - (a.minFeePerYear ?? 0);
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'nirf') return (a.nirfRanking ?? 999) - (b.nirfRanking ?? 999);
    return 0;
  });

  const total = results.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginated = results.slice(startIndex, startIndex + limit).map(mapDatabaseCollege);

  return {
    data: paginated,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getCollegeBySlug(slug: string): Promise<College | null> {
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('*, courses(*), college_contacts(*)')
        .eq('slug', slug)
        .single();
      if (!error && data) return mapDatabaseCollege(data);
    } catch {
      // Fallback
    }
  }

  const match = SEED_COLLEGES.find((c) => c.slug === slug);
  return match ? mapDatabaseCollege(match) : null;
}

export async function getCollegeById(id: string): Promise<College | null> {
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('*, courses(*), college_contacts(*)')
        .eq('id', id)
        .single();
      if (!error && data) return mapDatabaseCollege(data);
    } catch {
      // Fallback
    }
  }

  const match = SEED_COLLEGES.find((c) => c.id === id);
  return match ? mapDatabaseCollege(match) : null;
}

export async function getFeaturedColleges(): Promise<College[]> {
  const res = await searchColleges({ limit: 4, sortBy: 'rating' });
  return res.data;
}
