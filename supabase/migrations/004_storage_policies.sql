-- ==============================================================================
-- PART 2: AI Chatbot & Knowledge Base
-- Migration 004: Supabase Storage Policies for College Documents
-- ==============================================================================

-- 1. Ensure bucket exists (created with 15MB limit and allowed MIME types)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'college-documents',
  'college-documents',
  true,
  15728640,
  ARRAY['application/pdf', 'text/plain', 'text/markdown', 'text/csv']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['application/pdf', 'text/plain', 'text/markdown', 'text/csv'];

-- 2. Public Read Access: Students can view/download published institutional documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read for college documents'
  ) THEN
    CREATE POLICY "Public read for college documents"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'college-documents');
  END IF;
END $$;

-- 3. Write Access: Strictly restricted to service_role (bypasses RLS) or authenticated admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin write for college documents'
  ) THEN
    CREATE POLICY "Admin write for college documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'college-documents' AND 
      (auth.role() = 'service_role' OR (auth.jwt() ->> 'role') = 'admin')
    );
  END IF;
END $$;
