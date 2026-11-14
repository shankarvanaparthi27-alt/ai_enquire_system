import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/lib/config/env';

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(env.supabase.url, env.supabase.anonKey, {
      auth: {
        persistSession: false,
      },
    });
  }

  return supabaseClientInstance;
}

export { isSupabaseConfigured };
