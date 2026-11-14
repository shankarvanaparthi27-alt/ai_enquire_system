import { StudentProfile } from '@/types';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

const PROFILE_STORAGE_PREFIX = 'universe_ai_profile_';

export async function getStudentProfile(firebaseUid: string): Promise<StudentProfile | null> {
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('firebase_uid', firebaseUid)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          firebaseUid: data.firebase_uid,
          email: data.email,
          fullName: data.full_name,
          avatarUrl: data.avatar_url,
          phone: data.phone,
          city: data.city,
          state: data.state,
          preferredLanguage: data.preferred_language || 'en',
          preferredTheme: data.preferred_theme || 'system',
          targetDegree: data.target_degree,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn('Supabase profile fetch error:', err);
    }
  }

  // Fallback to local storage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${firebaseUid}`);
      if (stored) {
        return JSON.parse(stored) as StudentProfile;
      }
    } catch {
      // Ignore
    }
  }

  return null;
}

export async function syncStudentProfile(params: {
  firebaseUid: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}): Promise<StudentProfile> {
  const existing = await getStudentProfile(params.firebaseUid);

  // Prioritize explicit, real full name over placeholder 'Student'
  const effectiveName =
    params.fullName && params.fullName.trim() !== '' && params.fullName.trim() !== 'Student'
      ? params.fullName.trim()
      : (existing?.fullName && existing.fullName !== 'Student'
          ? existing.fullName
          : (params.fullName || 'Student'));

  const profile: StudentProfile = {
    id: existing?.id || `prof-${params.firebaseUid}`,
    firebaseUid: params.firebaseUid,
    email: params.email || existing?.email || '',
    fullName: effectiveName,
    avatarUrl: params.avatarUrl || existing?.avatarUrl,
    phone: existing?.phone || '',
    city: existing?.city || '',
    state: existing?.state || '',
    preferredLanguage: existing?.preferredLanguage || 'en',
    preferredTheme: existing?.preferredTheme || 'system',
    targetDegree: existing?.targetDegree || 'Engineering / Technology',
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('profiles').upsert(
        {
          firebase_uid: profile.firebaseUid,
          email: profile.email,
          full_name: profile.fullName,
          avatar_url: profile.avatarUrl,
          phone: profile.phone,
          city: profile.city,
          state: profile.state,
          preferred_language: profile.preferredLanguage,
          preferred_theme: profile.preferredTheme,
          target_degree: profile.targetDegree,
          updated_at: profile.updatedAt,
        },
        { onConflict: 'firebase_uid' }
      );
      if (error) {
        console.error('Supabase profile sync error:', error);
      }
    } catch (err) {
      console.warn('Supabase profile sync warning:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${params.firebaseUid}`, JSON.stringify(profile));
    } catch {
      // Ignore
    }
  }

  return profile;
}

export async function updateStudentProfile(
  firebaseUid: string,
  updates: Partial<StudentProfile>
): Promise<StudentProfile> {
  const current = (await getStudentProfile(firebaseUid)) || {
    id: `prof-${firebaseUid}`,
    firebaseUid,
    email: updates.email || '',
    fullName: updates.fullName || 'Student',
    preferredLanguage: 'en',
    preferredTheme: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated: StudentProfile = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updated.fullName,
          avatar_url: updated.avatarUrl,
          phone: updated.phone,
          city: updated.city,
          state: updated.state,
          preferred_language: updated.preferredLanguage,
          preferred_theme: updated.preferredTheme,
          target_degree: updated.targetDegree,
          updated_at: updated.updatedAt,
        })
        .eq('firebase_uid', firebaseUid);
      if (error) {
        console.error('Supabase profile update error:', error);
      }
    } catch (err) {
      console.warn('Supabase profile update warning:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${firebaseUid}`, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  return updated;
}
