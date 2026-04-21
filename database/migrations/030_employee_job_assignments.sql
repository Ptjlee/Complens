-- ============================================================
-- PayLens — Employee-to-Job Assignments
-- Migration: 030_employee_job_assignments.sql
-- ============================================================

-- Employee-to-Job assignments (many-to-one per dataset)
CREATE TABLE IF NOT EXISTS employee_job_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    dataset_id      UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    source          TEXT NOT NULL CHECK (source IN ('auto', 'manual', 'ai_suggested')),
    confidence      NUMERIC(4,2),
    match_reason    TEXT,
    status          TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    assigned_by     UUID REFERENCES auth.users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(employee_id, dataset_id)
);

CREATE INDEX idx_eja_org ON employee_job_assignments(org_id);
CREATE INDEX idx_eja_employee ON employee_job_assignments(employee_id);
CREATE INDEX idx_eja_job ON employee_job_assignments(job_id);
CREATE INDEX idx_eja_dataset ON employee_job_assignments(dataset_id);
CREATE INDEX idx_eja_status ON employee_job_assignments(org_id, status);

ALTER TABLE employee_job_assignments ENABLE ROW LEVEL SECURITY;

-- RLS: org members can read
CREATE POLICY eja_select ON employee_job_assignments FOR SELECT
    USING (org_id IN (SELECT org_id FROM organisation_members WHERE user_id = auth.uid()));

-- RLS: admin/analyst can write
CREATE POLICY eja_insert ON employee_job_assignments FOR INSERT
    WITH CHECK (org_id IN (SELECT org_id FROM organisation_members WHERE user_id = auth.uid() AND role IN ('admin', 'analyst')));

CREATE POLICY eja_update ON employee_job_assignments FOR UPDATE
    USING (org_id IN (SELECT org_id FROM organisation_members WHERE user_id = auth.uid() AND role IN ('admin', 'analyst')));

CREATE POLICY eja_delete ON employee_job_assignments FOR DELETE
    USING (org_id IN (SELECT org_id FROM organisation_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Add headcount_source to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS headcount_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (headcount_source IN ('manual', 'computed', 'both'));
