-- Migration: Allow many-to-many grade mapping (multiple grades per level)
-- Previously: unique on (org_id, level_id, salary_band_id) — one grade per level
-- Now: unique on (org_id, level_id, salary_band_id, mapped_grade) — multiple grades per level

-- Drop the old unique constraint that enforced one grade per level
ALTER TABLE job_grade_mappings DROP CONSTRAINT IF EXISTS job_grade_mappings_org_id_level_id_salary_band_id_key;

-- Add a new unique constraint that prevents duplicate mappings of the same grade to the same level
ALTER TABLE job_grade_mappings ADD CONSTRAINT job_grade_mappings_unique_mapping
  UNIQUE (org_id, level_id, salary_band_id, mapped_grade);
