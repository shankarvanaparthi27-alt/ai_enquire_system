import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/lib/config/env';

let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  const key = env.supabase.serviceRoleKey || env.supabase.anonKey;
  if (!key) return null;

  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(env.supabase.url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdminInstance;
}
