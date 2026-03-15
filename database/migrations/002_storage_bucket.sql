-- ============================================================
-- PayLens — Supabase Storage Bucket Setup
-- Migration: 002_storage_bucket.sql
-- Run in: Supabase SQL Editor
-- ============================================================

-- Create the private bucket for payroll file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payroll-uploads',
  'payroll-uploads',
  false,   -- PRIVATE — never public
  10485760, -- 10 MB max per file
  ARRAY[
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.oasis.opendocument.spreadsheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Storage RLS Policies
-- Files are organised as: {org_id}/{dataset_id}/{filename}
-- Users can only access files belonging to their own org.
-- ============================================================

-- Allow authenticated users to upload into their own org folder
CREATE POLICY "Org members can upload payroll files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payroll-uploads'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text FROM organisation_members
    WHERE user_id = auth.uid()
    LIMIT 1
  )
);

-- Allow org members to read their own org's files
CREATE POLICY "Org members can read their payroll files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payroll-uploads'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text FROM organisation_members
    WHERE user_id = auth.uid()
    LIMIT 1
  )
);

-- Allow org members to delete their own org's files
CREATE POLICY "Org members can delete their payroll files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payroll-uploads'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text FROM organisation_members
    WHERE user_id = auth.uid()
    LIMIT 1
  )
);
