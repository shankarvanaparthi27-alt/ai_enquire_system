import { College } from '@/types';
import { SEED_COLLEGES } from '@/data/seedColleges';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { mapDatabaseCollege } from './colleges';

const RECENT_PREFIX = 'universe_ai_recent_';

export async function getRecentlyViewedColleges(userId: string): Promise<College[]> {
  const supabase = getSupabaseClient();
  let ids: string[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('recently_viewed_colleges')
        .select('college_id, viewed_at')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(8);

      if (!error && data && data.length > 0) {
        ids = data.map((d) => d.college_id);
      }
    } catch (err) {
      console.warn('Supabase recently viewed fetch error:', err);
    }
  }

  // Fallback to local storage if DB returned nothing
  if (ids.length === 0 && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${RECENT_PREFIX}${userId}`);
      if (stored) {
        ids = JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
  }

  if (ids.length === 0) return [];

  // Query Supabase only for the requested institutional records
  let allDbColleges: College[] = [];
  if (isSupabaseConfigured && supabase && ids.length > 0) {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const uuidIds = ids.filter((id) => uuidRegex.test(id));
      const nonUuidIds = ids.filter((id) => !uuidRegex.test(id));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fetchedRows: any[] = [];

      if (uuidIds.length > 0) {
        const { data: byUuids, error: err1 } = await supabase
          .from('colleges')
          .select('*, courses(*), college_contacts(*)')
          .in('id', uuidIds);
        if (!err1 && byUuids) fetchedRows.push(...byUuids);
      }

      if (nonUuidIds.length > 0) {
        const { data: bySlugs, error: err2 } = await supabase
          .from('colleges')
          .select('*, courses(*), college_contacts(*)')
          .in('slug', nonUuidIds);
        if (!err2 && bySlugs) fetchedRows.push(...bySlugs);

        const remainingNonUuids = nonUuidIds.filter(
          (nid) => !fetchedRows.some((r) => r.slug === nid)
        );
        if (remainingNonUuids.length > 0) {
          const { data: byCode } = await supabase
            .from('colleges')
            .select('*, courses(*), college_contacts(*)')
            .in('code', remainingNonUuids.map((c) => c.toUpperCase()));
          if (byCode) fetchedRows.push(...byCode);
        }
      }

      if (fetchedRows.length > 0) {
        allDbColleges = fetchedRows.map(mapDatabaseCollege);
      }
    } catch (err) {
      console.warn('Supabase recently viewed colleges fetch error:', err);
    }
  }

  // Resolve each ID in exact order of viewed_at
  const resolved: College[] = [];
  for (const id of ids) {
    let found = allDbColleges.find(
      (c) => c.id === id || c.slug === id || c.code.toLowerCase() === id.toLowerCase()
    );

    if (!found) {
      const seedMatch = SEED_COLLEGES.find(
        (c) => c.id === id || c.slug === id || c.code.toLowerCase() === id.toLowerCase()
      );
      if (seedMatch) {
        found = mapDatabaseCollege(seedMatch);
      }
    }

    if (found && !resolved.some((r) => r.id === found!.id || r.slug === found!.slug)) {
      resolved.push(found);
    }
  }

  return resolved;
}

export async function trackRecentlyViewed(userId: string, collegeId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('recently_viewed_colleges').upsert({
        user_id: userId,
        college_id: collegeId,
        viewed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,college_id' });
      if (error) {
        console.error('Supabase recently viewed tracking error:', error);
      }
    } catch (err) {
      console.warn('Supabase recently viewed tracking error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${RECENT_PREFIX}${userId}`);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      const filtered = [collegeId, ...ids.filter((id) => id !== collegeId)].slice(0, 8);
      localStorage.setItem(`${RECENT_PREFIX}${userId}`, JSON.stringify(filtered));
    } catch {
      // Ignore
    }
  }
}
