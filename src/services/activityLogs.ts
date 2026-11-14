import { getSupabaseAdmin } from '@/lib/supabase/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { StudentActivityLog, StudentActivityType } from '@/types';

// In-memory fallback cache for development or pending schema migrations
const inMemoryLogs = new Map<string, StudentActivityLog[]>();

export interface LogActivityParams {
  userId: string;
  activityType: StudentActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logStudentActivity(params: LogActivityParams): Promise<StudentActivityLog | null> {
  const newLog: StudentActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    activityType: params.activityType,
    title: params.title,
    description: params.description,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    createdAt: new Date().toISOString(),
  };

  // Always update in-memory cache
  const userLogs = inMemoryLogs.get(params.userId) || [];
  userLogs.unshift(newLog);
  if (userLogs.length > 50) userLogs.pop();
  inMemoryLogs.set(params.userId, userLogs);

  // Attempt database persistence via Supabase Admin (or Client)
  const supabase = getSupabaseAdmin() || getSupabaseClient();
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('student_activity_logs')
        .insert({
          user_id: params.userId,
          activity_type: params.activityType,
          title: params.title,
          description: params.description || null,
          metadata: params.metadata || {},
          ip_address: params.ipAddress || null,
          user_agent: params.userAgent || null,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          activityType: data.activity_type,
          title: data.title,
          description: data.description,
          metadata: data.metadata,
          ipAddress: data.ip_address,
          userAgent: data.user_agent,
          createdAt: data.created_at,
        };
      }
    } catch {
      // Fallback silently to in-memory log
    }
  }

  return newLog;
}

export async function getStudentActivities(userId: string, limit: number = 20): Promise<StudentActivityLog[]> {
  const supabase = getSupabaseAdmin() || getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('student_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data.map((row) => ({
          id: row.id,
          userId: row.user_id,
          activityType: row.activity_type,
          title: row.title,
          description: row.description,
          metadata: row.metadata,
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          createdAt: row.created_at,
        }));
      }
    } catch {
      // Fallback to in-memory cache
    }
  }

  const cached = inMemoryLogs.get(userId) || [];
  return cached.slice(0, limit);
}
