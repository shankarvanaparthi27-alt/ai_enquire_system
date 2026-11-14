-- ==============================================================================
-- PART 2: UniVerse AI — Intelligent College Enquiry & Discovery System
-- Migration 003: Revised Cutoff Ranks Schema with Verification Governance & RLS
-- ==============================================================================
-- Changes & Features:
-- 1. Dual metric model: Rank-based (JEE, NEET, CLAT), Percentile-based (CAT, XAT),
--    and Score-based (BITSAT, GATE).
-- 2. Verification lifecycle: verification_status ('pending', 'verified', 'rejected'),
--    verified_at, verified_by.
-- 3. RLS: Public SELECT restricted strictly to verified records (verification_status = 'verified').
-- 4. No redundant service_role write policy (service_role bypasses RLS).
-- 5. Automatic updated_at trigger via set_updated_at().
-- 6. Integrity checks: positive ranks, closing >= opening, valid percentiles (0-100),
--    positive rounds.
-- 7. Cross-entity validation trigger: prevents assigning a course_id that belongs
--    to a different college_id.
-- 8. Uses core PostgreSQL gen_random_uuid() for primary keys.
-- 9. Drops incomplete previous draft table if existing (safe: 0 rows).
-- ==============================================================================

-- 1. Automatic Timestamp Trigger Function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Safely drop incomplete previous draft if exists
DROP TABLE IF EXISTS cutoff_ranks CASCADE;

-- 3. Create Revised Cutoff Ranks Table
CREATE TABLE cutoff_ranks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  exam_name TEXT NOT NULL,
  cutoff_type TEXT NOT NULL DEFAULT 'rank' CHECK (cutoff_type IN ('rank', 'percentile', 'score')),
  category TEXT NOT NULL DEFAULT 'General',
  quota TEXT NOT NULL DEFAULT 'All India',
  
  -- Metrics: Populated according to cutoff_type
  opening_rank INTEGER,
  closing_rank INTEGER,
  min_percentile NUMERIC(5, 2),
  min_score NUMERIC(6, 2),
  max_score NUMERIC(6, 2),
  
  -- Counseling Round & Academic Cohort
  round INTEGER NOT NULL DEFAULT 1 CHECK (round >= 1),
  academic_year TEXT NOT NULL DEFAULT '2024-2025',
  
  -- Verification & Governance Lifecycle
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  
  -- Source Citation & Audit
  source_authority TEXT NOT NULL DEFAULT 'Official Counseling Authority',
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Validation Constraint: Metric integrity by examination type
  CONSTRAINT chk_cutoff_metric_validity CHECK (
    (
      cutoff_type = 'rank' AND 
      opening_rank IS NOT NULL AND 
      closing_rank IS NOT NULL AND 
      opening_rank > 0 AND 
      closing_rank > 0 AND 
      closing_rank >= opening_rank
    ) OR
    (
      cutoff_type = 'percentile' AND 
      min_percentile IS NOT NULL AND 
      min_percentile >= 0.00 AND 
      min_percentile <= 100.00
    ) OR
    (
      cutoff_type = 'score' AND 
      min_score IS NOT NULL AND 
      min_score >= 0 AND 
      (max_score IS NULL OR min_score <= max_score)
    )
  )
);

-- 4. Cross-Entity Integrity: Ensure course belongs to the specified college
CREATE OR REPLACE FUNCTION validate_cutoff_college_course()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.course_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM courses
      WHERE id = NEW.course_id AND college_id = NEW.college_id
    ) THEN
      RAISE EXCEPTION 'Foreign Key Integrity Violation: course_id % does not belong to college_id %',
        NEW.course_id, NEW.college_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_cutoff_college_course ON cutoff_ranks;
CREATE TRIGGER trg_validate_cutoff_college_course
  BEFORE INSERT OR UPDATE ON cutoff_ranks
  FOR EACH ROW
  EXECUTE FUNCTION validate_cutoff_college_course();

-- 5. Automatic updated_at Trigger
DROP TRIGGER IF EXISTS trg_cutoff_ranks_updated_at ON cutoff_ranks;
CREATE TRIGGER trg_cutoff_ranks_updated_at
  BEFORE UPDATE ON cutoff_ranks
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- 6. Indexes for Predictor & Directory Lookups
-- Index for rank-based predictor queries (filtered to verified records only)
CREATE INDEX IF NOT EXISTS idx_cutoff_ranks_predictor_rank
ON cutoff_ranks(exam_name, category, quota, closing_rank)
WHERE verification_status = 'verified' AND cutoff_type = 'rank';

-- Index for percentile-based predictor queries (e.g. CAT/XAT)
CREATE INDEX IF NOT EXISTS idx_cutoff_ranks_predictor_percentile
ON cutoff_ranks(exam_name, category, quota, min_percentile)
WHERE verification_status = 'verified' AND cutoff_type = 'percentile';

-- Index for college & course details / comparison matrix
CREATE INDEX IF NOT EXISTS idx_cutoff_ranks_college_course
ON cutoff_ranks(college_id, course_id)
WHERE verification_status = 'verified';

-- Index for academic year filtering
CREATE INDEX IF NOT EXISTS idx_cutoff_ranks_year
ON cutoff_ranks(academic_year);

-- 7. Row Level Security (RLS)
ALTER TABLE cutoff_ranks ENABLE ROW LEVEL SECURITY;

-- Public Policy: Only VERIFIED records can be viewed publicly
DROP POLICY IF EXISTS "Public read verified cutoff_ranks" ON cutoff_ranks;
CREATE POLICY "Public read verified cutoff_ranks" ON cutoff_ranks
  FOR SELECT USING (verification_status = 'verified');
