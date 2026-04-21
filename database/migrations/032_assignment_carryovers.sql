-- ============================================================
-- PayLens — Assignment Carryovers (cross-dataset job continuity)
-- Migration: 032_assignment_carryovers.sql
-- ============================================================

-- Tracks job assignments carried over between datasets
CREATE TABLE IF NOT EXISTS assignment_carryovers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id              UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    target_dataset_id   UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    source_dataset_id   UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    identity_id         UUID NOT NULL REFERENCES employee_identities(id) ON DELETE CASCADE,
    target_employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    source_employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    carried_job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    match_method        TEXT NOT NULL CHECK (match_method IN ('employee_ref', 'name_department', 'name_only')),
    match_confidence    NUMERIC(4,2) NOT NULL,
    change_flags        JSONB NOT NULL DEFAULT '{}',
    status              TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rejected', 'reassigned')),
    reviewed_by         UUID REFERENCES auth.users(id),
    reviewed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ac_org ON assignment_carryovers(org_id);
CREATE INDEX idx_ac_target_dataset ON assignment_carryovers(target_dataset_id);
CREATE INDEX idx_ac_identity ON assignment_carryovers(identity_id);
CREATE INDEX idx_ac_target_status ON assignment_carryovers(target_dataset_id, status);

ALTER TABLE assignment_carryovers ENABLE ROW LEVEL SECURITY;

-- RLS: org members can read
CREATE POLICY ac_select ON assignment_carryovers FOR SELECT
    USING (org_id IN (SELECT org_id FROM organisation_members WHERE user_id = auth.uid()));

-- RLS: admin/analyst can write
CREATE POLICY ac_insert ON assignment_carryovers FOR INSERT
    WITH CHECK (org_id IN (SELECT org_id FROM organisation_members WHERE user_id = auth.uid() AND role IN ('admin', 'analyst')));

CREATE POLICY ac_update ON assignment_carryovers FOR UPDATE
    USING (org_id IN (SELECT org_id FROM organisation_members WHERE user_id = auth.uid() AND role IN ('admin', 'analyst')));

CREATE POLICY ac_delete ON assignment_carryovers FOR DELETE
    USING (org_id IN (SELECT org_id FROM organisation_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Expand source CHECK on employee_job_assignments to include 'carryover'
ALTER TABLE employee_job_assignments DROP CONSTRAINT IF EXISTS employee_job_assignments_source_check;
ALTER TABLE employee_job_assignments ADD CONSTRAINT employee_job_assignments_source_check
    CHECK (source IN ('auto', 'manual', 'ai_suggested', 'carryover'));

-- Link assignments to their carryover origin
ALTER TABLE employee_job_assignments ADD COLUMN IF NOT EXISTS carryover_id UUID REFERENCES assignment_carryovers(id) ON DELETE SET NULL;
