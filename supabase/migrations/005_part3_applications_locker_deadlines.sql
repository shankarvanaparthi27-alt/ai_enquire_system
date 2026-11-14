-- ==============================================================================
-- PART 3: UniVerse AI — Applications, Document Vault, Deadlines & Helpdesk
-- Migration 005: Student Applications, Document Locker, Admission Deadlines,
--                Multilingual Enquiries, Activity Logs & Storage Configuration
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
-- 2. COLLEGE APPLICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS college_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  application_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'submitted', 'under_review', 'shortlisted', 'interview_scheduled', 'admitted', 'rejected', 'withdrawn')
  ),
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  quota TEXT NOT NULL DEFAULT 'All India',
  exam_name TEXT,
  score_or_rank NUMERIC,
  academic_year TEXT NOT NULL DEFAULT '2026-2027',
  statement_of_purpose TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate applications for same user, college, course, and year
  CONSTRAINT uq_user_college_course_year UNIQUE (user_id, college_id, course_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_college_applications_user ON college_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_college_applications_college ON college_applications(college_id);
CREATE INDEX IF NOT EXISTS idx_college_applications_status ON college_applications(status);

DROP TRIGGER IF EXISTS trg_college_applications_updated_at ON college_applications;
CREATE TRIGGER trg_college_applications_updated_at
BEFORE UPDATE ON college_applications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 3. APPLICATION TIMELINE HISTORY
-- ==============================================================================
CREATE TABLE IF NOT EXISTS application_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES college_applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_timeline_application ON application_timeline(application_id);

-- ==============================================================================
-- 4. ADMISSION DEADLINES & CALENDAR ALERTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS admission_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  exam_name TEXT,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'application_deadline' CHECK (
    event_type IN ('application_deadline', 'exam_date', 'result_announcement', 'counseling_round', 'document_verification', 'seat_acceptance')
  ),
  degree_level TEXT DEFAULT 'All',
  deadline_date TIMESTAMPTZ NOT NULL,
  description TEXT,
  official_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admission_deadlines_date ON admission_deadlines(deadline_date);
CREATE INDEX IF NOT EXISTS idx_admission_deadlines_exam ON admission_deadlines(exam_name);
CREATE INDEX IF NOT EXISTS idx_admission_deadlines_college ON admission_deadlines(college_id);

DROP TRIGGER IF EXISTS trg_admission_deadlines_updated_at ON admission_deadlines;
CREATE TRIGGER trg_admission_deadlines_updated_at
BEFORE UPDATE ON admission_deadlines
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 5. STUDENT DIGITAL DOCUMENT VAULT / LOCKER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  doc_type TEXT NOT NULL CHECK (
    doc_type IN (
      'class_10_marksheet',
      'class_12_marksheet',
      'degree_certificate',
      'rank_card',
      'category_certificate',
      'identity_proof',
      'transfer_certificate',
      'other'
    )
  ),
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  mime_type TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (
    verification_status IN ('uploaded', 'verified', 'rejected', 'requires_reupload')
  ),
  rejection_reason TEXT,
  academic_year TEXT DEFAULT '2026-2027',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_documents_user ON student_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_type ON student_documents(doc_type);

DROP TRIGGER IF EXISTS trg_student_documents_updated_at ON student_documents;
CREATE TRIGGER trg_student_documents_updated_at
BEFORE UPDATE ON student_documents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==============================================================================
-- 6. MULTILINGUAL ENQUIRIES & HELPDESK TICKETS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS student_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'admissions' CHECK (
    category IN ('admissions', 'fees_scholarship', 'hostel_campus', 'eligibility_cutoffs', 'placements', 'general')
  ),
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'in_progress', 'resolved', 'closed')
  ),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (
    priority IN ('low', 'medium', 'high', 'urgent')
  ),
  initial_message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_enquiries_user ON student_enquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_student_enquiries_college ON student_enquiries(college_id);
CREATE INDEX IF NOT EXISTS idx_student_enquiries_status ON student_enquiries(status);

DROP TRIGGER IF EXISTS trg_student_enquiries_updated_at ON student_enquiries;
CREATE TRIGGER trg_student_enquiries_updated_at
BEFORE UPDATE ON student_enquiries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Enquiry Message Replies Thread
CREATE TABLE IF NOT EXISTS enquiry_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES student_enquiries(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('student', 'institution', 'counselor')),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiry_messages_enquiry ON enquiry_messages(enquiry_id);

-- ==============================================================================
-- 8. STUDENT ACTIVITY LOGS & AUDIT TRAIL
-- ==============================================================================
CREATE TABLE IF NOT EXISTS student_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (
    activity_type IN (
      'application_created',
      'application_submitted',
      'application_withdrawn',
      'document_uploaded',
      'document_deleted',
      'enquiry_created',
      'enquiry_replied',
      'prediction_run',
      'college_favourited',
      'profile_updated'
    )
  ),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_activity_logs_user ON student_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_logs_type ON student_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_student_activity_logs_created ON student_activity_logs(created_at DESC);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE college_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiry_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_activity_logs ENABLE ROW LEVEL SECURITY;

-- Public/Verified Read for Deadlines (all students can browse official counseling deadlines)
CREATE POLICY "Public read verified admission deadlines"
  ON admission_deadlines FOR SELECT
  USING (is_verified = TRUE);

-- Applications Policies
CREATE POLICY "Applications open for app service"
  ON college_applications FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Application timeline open for app service"
  ON application_timeline FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Student Documents Policies
CREATE POLICY "Student documents open for app service"
  ON student_documents FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Student Enquiries Policies
CREATE POLICY "Student enquiries open for app service"
  ON student_enquiries FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Enquiry messages open for app service"
  ON enquiry_messages FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Student Activity Logs Policies
CREATE POLICY "Student activity logs open for app service"
  ON student_activity_logs FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- ==============================================================================
-- 10. SUPABASE STORAGE BUCKET: student-vault
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-vault',
  'student-vault',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png'];
