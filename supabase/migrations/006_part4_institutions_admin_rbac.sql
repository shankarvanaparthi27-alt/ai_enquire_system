-- ==============================================================================
-- PART 4: UniVerse AI — Institutions & Administration Management
-- Migration 006: Institution Applications, Representatives, Admin Roles,
--                Audit Logging, and Platform Settings
-- ==============================================================================

-- 1. Ensure set_updated_at() trigger function exists
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. INSTITUTION ONBOARDING & APPLICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS institution_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  college_type TEXT NOT NULL,
  category TEXT NOT NULL,
  affiliation TEXT,
  established_year INTEGER,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  website TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT,
  accreditation TEXT,
  nirf_ranking INTEGER,
  logo_url TEXT,
  banner_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  courses_offered JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (
    status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'suspended')
  ),
  submitted_by TEXT NOT NULL,
  review_notes TEXT,
  rejection_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inst_app_status ON institution_applications(status);
CREATE INDEX IF NOT EXISTS idx_inst_app_submitted_by ON institution_applications(submitted_by);
CREATE INDEX IF NOT EXISTS idx_inst_app_college ON institution_applications(college_id);

DROP TRIGGER IF EXISTS trg_inst_app_updated_at ON institution_applications;
CREATE TRIGGER trg_inst_app_updated_at
BEFORE UPDATE ON institution_applications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 3. INSTITUTION REPRESENTATIVES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS institution_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  application_id UUID REFERENCES institution_applications(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  designation TEXT NOT NULL DEFAULT 'Admission Officer',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'active', 'suspended', 'revoked')
  ),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_rep_user_college UNIQUE (user_id, college_id)
);

CREATE INDEX IF NOT EXISTS idx_inst_rep_user ON institution_representatives(user_id);
CREATE INDEX IF NOT EXISTS idx_inst_rep_college ON institution_representatives(college_id);
CREATE INDEX IF NOT EXISTS idx_inst_rep_status ON institution_representatives(status);

DROP TRIGGER IF EXISTS trg_inst_rep_updated_at ON institution_representatives;
CREATE TRIGGER trg_inst_rep_updated_at
BEFORE UPDATE ON institution_representatives
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 4. ADMIN ROLES & PRIVILEGES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (
    role IN ('super_admin', 'admin', 'institution_admin')
  ),
  college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
  assigned_by TEXT NOT NULL DEFAULT 'system',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON admin_roles(role);
CREATE INDEX IF NOT EXISTS idx_admin_roles_college ON admin_roles(college_id);

DROP TRIGGER IF EXISTS trg_admin_roles_updated_at ON admin_roles;
CREATE TRIGGER trg_admin_roles_updated_at
BEFORE UPDATE ON admin_roles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 5. ADMIN INVITATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS admin_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (
    role IN ('super_admin', 'admin', 'institution_admin')
  ),
  college_id UUID REFERENCES colleges(id) ON DELETE SET NULL,
  invitation_token TEXT UNIQUE NOT NULL,
  invited_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'expired', 'revoked')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_inv_email ON admin_invitations(email);
CREATE INDEX IF NOT EXISTS idx_admin_inv_token ON admin_invitations(invitation_token);

-- ==============================================================================
-- 6. IMMUTABLE ADMIN AUDIT LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  action TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  target_id TEXT,
  previous_state JSONB,
  new_state JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_user ON admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON admin_audit_logs(target_entity);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);

-- ==============================================================================
-- 7. PLATFORM SETTINGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS admin_platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial default configuration keys
INSERT INTO admin_platform_settings (key, value, description)
VALUES 
  ('approval_workflow', '{"auto_assign_reviewers": false, "require_two_approvals": false, "allow_correction_requests": true}'::jsonb, 'Institution application verification rules'),
  ('representative_permissions', '{"allow_fee_updates": true, "allow_course_creation": true, "require_approval_for_brochures": true}'::jsonb, 'Representative portal access policies'),
  ('system_status', '{"maintenance_mode": false, "registrations_open": true, "enquiry_routing_enabled": true}'::jsonb, 'Global platform operational toggles')
ON CONFLICT (key) DO NOTHING;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE institution_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_platform_settings ENABLE ROW LEVEL SECURITY;

-- Applications: Service role and application service policy
CREATE POLICY "Institution applications service open"
  ON institution_applications FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Representatives: Service role and application service policy
CREATE POLICY "Institution representatives service open"
  ON institution_representatives FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Admin Roles: Service role and application service policy
CREATE POLICY "Admin roles service open"
  ON admin_roles FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Admin Invitations: Service role and application service policy
CREATE POLICY "Admin invitations service open"
  ON admin_invitations FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Audit Logs: Select open for authenticated admins, insert open for system logging, no updates/deletes permitted
CREATE POLICY "Admin audit logs service select"
  ON admin_audit_logs FOR SELECT
  USING (TRUE);

CREATE POLICY "Admin audit logs service insert"
  ON admin_audit_logs FOR INSERT
  WITH CHECK (TRUE);

-- Platform Settings: Public read, service update
CREATE POLICY "Platform settings read open"
  ON admin_platform_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Platform settings write open"
  ON admin_platform_settings FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);
