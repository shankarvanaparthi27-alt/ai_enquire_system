import { getSupabaseAdmin } from '@/lib/supabase/server';
import { AdminAuditLog } from '@/types';

// In-memory fallback for audit logs during local development
const inMemoryAuditLogs: AdminAuditLog[] = [];

export interface LogAdminActionParams {
  userId: string;
  email?: string;
  role: string;
  action: string;
  targetEntity: string;
  targetId?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAdminAction(params: LogAdminActionParams): Promise<AdminAuditLog> {
  const now = new Date().toISOString();
  const logEntry: AdminAuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId,
    email: params.email,
    role: params.role || 'admin',
    action: params.action,
    targetEntity: params.targetEntity,
    targetId: params.targetId,
    previousState: params.previousState,
    newState: params.newState,
    metadata: params.metadata || {},
    ipAddress: params.ipAddress,
    createdAt: now,
  };

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .insert({
          user_id: params.userId,
          email: params.email || null,
          role: params.role || 'admin',
          action: params.action,
          target_entity: params.targetEntity,
          target_id: params.targetId || null,
          previous_state: params.previousState || null,
          new_state: params.newState || null,
          metadata: params.metadata || {},
          ip_address: params.ipAddress || null,
        })
        .select()
        .single();

      if (!error && data) {
        logEntry.id = data.id;
      }
    } catch {
      // In-memory fallback
    }
  }

  inMemoryAuditLogs.unshift(logEntry);
  if (inMemoryAuditLogs.length > 500) {
    inMemoryAuditLogs.pop();
  }

  return logEntry;
}

export async function getAdminAuditLogs(params?: {
  limit?: number;
  action?: string;
  targetEntity?: string;
  userId?: string;
}): Promise<AdminAuditLog[]> {
  const limit = params?.limit || 50;
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (params?.action) query = query.eq('action', params.action);
      if (params?.targetEntity) query = query.eq('target_entity', params.targetEntity);
      if (params?.userId) query = query.eq('user_id', params.userId);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          email: r.email,
          role: r.role,
          action: r.action,
          targetEntity: r.target_entity,
          targetId: r.target_id,
          previousState: r.previous_state,
          newState: r.new_state,
          metadata: r.metadata,
          ipAddress: r.ip_address,
          createdAt: r.created_at,
        }));
      }
    } catch {
      // In-memory fallback
    }
  }

  let filtered = [...inMemoryAuditLogs];
  if (params?.action) filtered = filtered.filter((l) => l.action === params.action);
  if (params?.targetEntity) filtered = filtered.filter((l) => l.targetEntity === params.targetEntity);
  if (params?.userId) filtered = filtered.filter((l) => l.userId === params.userId);
  return filtered.slice(0, limit);
}
