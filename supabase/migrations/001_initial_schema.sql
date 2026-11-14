-- ==============================================================================
-- PART 1: AI Chatbot for College Enquiry System
-- Migration 001: Initial Core Schema with Row Level Security (RLS)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Student Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  firebase_uid TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  preferred_theme TEXT NOT NULL DEFAULT 'system',
  target_degree TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on firebase_uid for fast profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON profiles(firebase_uid);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  preferred_locations TEXT[] DEFAULT '{}',
  preferred_courses TEXT[] DEFAULT '{}',
  preferred_college_types TEXT[] DEFAULT '{}',
  budget_min NUMERIC DEFAULT 0,
  budget_max NUMERIC DEFAULT 10000000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_preferences UNIQUE (user_id)
);

-- 3. Colleges Table (Master Directory managed by Platform Owner)
CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  college_type TEXT NOT NULL,
  category TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  website TEXT,
  established_year INTEGER,
  accreditation TEXT,
  nirf_ranking INTEGER,
  rating NUMERIC(3, 2) DEFAULT 4.00,
  review_count INTEGER DEFAULT 0,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  min_fee_per_year NUMERIC DEFAULT 0,
  max_fee_per_year NUMERIC DEFAULT 0,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning fast multi-factor search
CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_colleges_location ON colleges(state, city);
CREATE INDEX IF NOT EXISTS idx_colleges_type ON colleges(college_type);
CREATE INDEX IF NOT EXISTS idx_colleges_category ON colleges(category);
CREATE INDEX IF NOT EXISTS idx_colleges_rating ON colleges(rating DESC);
CREATE INDEX IF NOT EXISTS idx_colleges_fees ON colleges(min_fee_per_year, max_fee_per_year);

-- 4. College Contacts Table
CREATE TABLE IF NOT EXISTS college_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  admission_helpline TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT,
  CONSTRAINT uq_college_contacts UNIQUE (college_id)
);

-- 5. Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  degree_level TEXT NOT NULL,
  department TEXT NOT NULL,
  duration_years NUMERIC(2, 1) NOT NULL,
  eligibility TEXT,
  seats INTEGER DEFAULT 60,
  tuition_fee_per_year NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_college_id ON courses(college_id);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);
CREATE INDEX IF NOT EXISTS idx_courses_fee ON courses(tuition_fee_per_year);

-- 6. Course & College Fees Breakdown Table
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  tuition_fee_per_year NUMERIC NOT NULL,
  hostel_fee_per_year NUMERIC DEFAULT 0,
  other_charges NUMERIC DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  academic_year TEXT DEFAULT '2025-2026',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Student Favourite Colleges Table
CREATE TABLE IF NOT EXISTS favourite_colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  college_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_favourite_college UNIQUE (user_id, college_id)
);

CREATE INDEX IF NOT EXISTS idx_favourites_user ON favourite_colleges(user_id);

-- 8. Recently Viewed Colleges Table
CREATE TABLE IF NOT EXISTS recently_viewed_colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  college_id TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_recent_college UNIQUE (user_id, college_id)
);

CREATE INDEX IF NOT EXISTS idx_recent_user ON recently_viewed_colleges(user_id, viewed_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE favourite_colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE recently_viewed_colleges ENABLE ROW LEVEL SECURITY;

-- Colleges, Contacts, Courses, Fees are public read-only for students
CREATE POLICY "Public read for colleges" ON colleges
  FOR SELECT USING (true);

CREATE POLICY "Public read for college_contacts" ON college_contacts
  FOR SELECT USING (true);

CREATE POLICY "Public read for courses" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Public read for fees" ON fees
  FOR SELECT USING (true);

-- Only platform service role can insert/update/delete official college data
CREATE POLICY "Admin write for colleges" ON colleges
  FOR ALL USING (auth.role() = 'service_role');

-- Profiles: Open access for Firebase-authenticated applications
CREATE POLICY "Public profiles select" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Public profiles update" ON profiles
  FOR UPDATE USING (true);

CREATE POLICY "Public profiles insert" ON profiles
  FOR INSERT WITH CHECK (true);

-- Favourites: Open access for Firebase-authenticated applications
CREATE POLICY "Public favourites select" ON favourite_colleges
  FOR SELECT USING (true);

CREATE POLICY "Public favourites insert" ON favourite_colleges
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public favourites delete" ON favourite_colleges
  FOR DELETE USING (true);

-- Recently Viewed: Open access for Firebase-authenticated applications
CREATE POLICY "Public recently viewed select" ON recently_viewed_colleges
  FOR SELECT USING (true);

CREATE POLICY "Public recently viewed insert" ON recently_viewed_colleges
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public recently viewed update" ON recently_viewed_colleges
  FOR UPDATE USING (true);

-- User Preferences: Open access for Firebase-authenticated applications
CREATE POLICY "Public user preferences all" ON user_preferences
  FOR ALL USING (true);
