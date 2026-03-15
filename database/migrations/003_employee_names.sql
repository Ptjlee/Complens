-- ============================================================
-- PayLens — Optional employee name columns
-- Migration: 003_employee_names.sql
-- ============================================================

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name  TEXT;

COMMENT ON COLUMN employees.first_name IS 'Optional — only stored when org admin explicitly enables name collection. Personal data under GDPR Art. 4.';
COMMENT ON COLUMN employees.last_name  IS 'Optional — only stored when org admin explicitly enables name collection. Personal data under GDPR Art. 4.';
