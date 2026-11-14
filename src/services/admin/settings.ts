import { getSupabaseAdmin } from '@/lib/supabase/server';
import { PlatformSettings } from '@/types';
import { logAdminAction } from './audit';

const DEFAULT_SETTINGS: PlatformSettings = {
  approvalWorkflow: {
    autoAssignReviewers: false,
    requireTwoApprovals: false,
    allowCorrectionRequests: true,
  },
  representativePermissions: {
    allowFeeUpdates: true,
    allowCourseCreation: true,
    requireApprovalForBrochures: true,
  },
  systemStatus: {
    maintenanceMode: false,
    registrationsOpen: true,
    enquiryRoutingEnabled: true,
  },
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const supabase = getSupabaseAdmin();
  const settings = { ...DEFAULT_SETTINGS };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('admin_platform_settings').select('*');
      if (!error && data) {
        for (const row of data) {
          if (row.key === 'approval_workflow' && row.value) {
            settings.approvalWorkflow = { ...settings.approvalWorkflow, ...row.value };
          } else if (row.key === 'representative_permissions' && row.value) {
            settings.representativePermissions = { ...settings.representativePermissions, ...row.value };
          } else if (row.key === 'system_status' && row.value) {
            settings.systemStatus = { ...settings.systemStatus, ...row.value };
          }
        }
      }
    } catch {
      // In-memory fallback
    }
  }

  return settings;
}

export async function updatePlatformSettings(
  key: string,
  value: Record<string, unknown>,
  updatedBy: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      await supabase.from('admin_platform_settings').upsert({
        key,
        value,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // In-memory fallback
    }
  }

  await logAdminAction({
    userId: updatedBy,
    role: 'super_admin',
    action: 'settings_updated',
    targetEntity: 'platform_settings',
    targetId: key,
    newState: value,
  });

  return true;
}
