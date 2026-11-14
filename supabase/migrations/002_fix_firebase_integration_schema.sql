-- ==============================================================================
-- PART 1: AI Chatbot for College Enquiry System
-- Migration 002: Fix Column Types and RLS for Firebase Authentication (Revised)
-- ==============================================================================
-- NOTE: In Postgres, all policies referencing a column must be dropped FIRST
-- before changing the column type.
-- ==============================================================================

-- 1. DROP ALL DEPENDENT POLICIES FIRST
DROP POLICY IF EXISTS "Students can view own favourites" ON favourite_colleges;
DROP POLICY IF EXISTS "Students can add own favourite" ON favourite_colleges;
DROP POLICY IF EXISTS "Students can remove own favourite" ON favourite_colleges;
DROP POLICY IF EXISTS "Public favourites all" ON favourite_colleges;
DROP POLICY IF EXISTS "Public favourites select" ON favourite_colleges;
DROP POLICY IF EXISTS "Public favourites insert" ON favourite_colleges;
DROP POLICY IF EXISTS "Public favourites delete" ON favourite_colleges;

DROP POLICY IF EXISTS "Students can view own recently viewed" ON recently_viewed_colleges;
DROP POLICY IF EXISTS "Students can insert own recently viewed" ON recently_viewed_colleges;
DROP POLICY IF EXISTS "Public recently viewed all" ON recently_viewed_colleges;
DROP POLICY IF EXISTS "Public recently viewed select" ON recently_viewed_colleges;
DROP POLICY IF EXISTS "Public recently viewed insert" ON recently_viewed_colleges;
DROP POLICY IF EXISTS "Public recently viewed update" ON recently_viewed_colleges;

DROP POLICY IF EXISTS "Students can manage own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Public user preferences all" ON user_preferences;

DROP POLICY IF EXISTS "Students can read own profile" ON profiles;
DROP POLICY IF EXISTS "Students can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Students can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles select" ON profiles;
DROP POLICY IF EXISTS "Public profiles insert" ON profiles;
DROP POLICY IF EXISTS "Public profiles update" ON profiles;

-- 2. DROP CONSTRAINTS
ALTER TABLE favourite_colleges DROP CONSTRAINT IF EXISTS favourite_colleges_user_id_fkey;
ALTER TABLE favourite_colleges DROP CONSTRAINT IF EXISTS favourite_colleges_college_id_fkey;
ALTER TABLE favourite_colleges DROP CONSTRAINT IF EXISTS uq_user_favourite_college;

ALTER TABLE recently_viewed_colleges DROP CONSTRAINT IF EXISTS recently_viewed_colleges_user_id_fkey;
ALTER TABLE recently_viewed_colleges DROP CONSTRAINT IF EXISTS recently_viewed_colleges_college_id_fkey;
ALTER TABLE recently_viewed_colleges DROP CONSTRAINT IF EXISTS uq_user_recent_college;

ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS uq_user_preferences;

-- 3. ALTER COLUMN TYPES TO TEXT
ALTER TABLE favourite_colleges ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE favourite_colleges ALTER COLUMN college_id TYPE TEXT;

ALTER TABLE recently_viewed_colleges ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE recently_viewed_colleges ALTER COLUMN college_id TYPE TEXT;

ALTER TABLE user_preferences ALTER COLUMN user_id TYPE TEXT;

-- 4. RECREATE UNIQUE CONSTRAINTS
ALTER TABLE favourite_colleges ADD CONSTRAINT uq_user_favourite_college UNIQUE (user_id, college_id);
ALTER TABLE recently_viewed_colleges ADD CONSTRAINT uq_user_recent_college UNIQUE (user_id, college_id);
ALTER TABLE user_preferences ADD CONSTRAINT uq_user_preferences UNIQUE (user_id);

-- 5. CREATE NEW OPEN POLICIES FOR APPLICATION TABLES
CREATE POLICY "Public profiles select" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public profiles insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public profiles update" ON profiles FOR UPDATE USING (true);

CREATE POLICY "Public favourites all" ON favourite_colleges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public recently viewed all" ON recently_viewed_colleges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public user preferences all" ON user_preferences FOR ALL USING (true) WITH CHECK (true);
