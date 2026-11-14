import { College } from '@/types';
import { SEED_COLLEGES } from '@/data/seedColleges';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { mapDatabaseCollege } from './colleges';

const FAVOURITES_PREFIX = 'universe_ai_favs_';

export async function getFavouriteColleges(userId: string): Promise<College[]> {
  const supabase = getSupabaseClient();
  let ids: string[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('favourite_colleges')
        .select('college_id')
        .eq('user_id', userId);

      if (!error && data && data.length > 0) {
        ids = data.map((d) => d.college_id);
      }
    } catch (err) {
      console.warn('Supabase favourites fetch error:', err);
    }
  }

  // Fallback to local storage if DB returned nothing
  if (ids.length === 0 && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${FAVOURITES_PREFIX}${userId}`);
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
      console.warn('Supabase favourites colleges fetch error:', err);
    }
  }

  // Resolve each ID in exact order
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

export async function isCollegeFavourite(userId: string, collegeId: string): Promise<boolean> {
  const favs = await getFavouriteColleges(userId);
  return favs.some((c) => c.id === collegeId || c.slug === collegeId || c.code.toLowerCase() === collegeId.toLowerCase());
}

export async function toggleFavouriteCollege(userId: string, collegeId: string): Promise<boolean> {
  const favs = await getFavouriteColleges(userId);
  const exists = favs.some((c) => c.id === collegeId || c.slug === collegeId || c.code.toLowerCase() === collegeId.toLowerCase());
  const newIds = exists
    ? favs.filter((c) => c.id !== collegeId && c.slug !== collegeId).map((c) => c.id)
    : [...favs.map((c) => c.id), collegeId];

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      if (exists) {
        const { error } = await supabase
          .from('favourite_colleges')
          .delete()
          .match({ user_id: userId, college_id: collegeId });
        if (error) console.error('Supabase delete favourite error:', error);
      } else {
        const { error } = await supabase
          .from('favourite_colleges')
          .insert({ user_id: userId, college_id: collegeId });
        if (error) console.error('Supabase insert favourite error:', error);
      }
    } catch (err) {
      console.warn('Supabase favourites toggle error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${FAVOURITES_PREFIX}${userId}`, JSON.stringify(newIds));
    } catch {
      // Ignore
    }
  }

  return !exists;
}
