-- ============================================================
-- PayLens — Employee Identities (stable cross-dataset identity)
-- Migration: 031_employee_identities.sql
-- ============================================================

-- Stable identity that links employees across datasets
CREATE TABLE IF NOT EXISTS employee_identities (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id               UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    employee_ref         TEXT NOT NULL,
    canonical_name       TEXT,
    first_seen_dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
    last_seen_dataset_id  UUID REFERENCES datasets(id) ON DELETE SET NULL,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, employee_ref)
);

CREATE INDEX idx_ei_org ON employee_identities(org_id);
CREATE INDEX idx_ei_org_ref ON employee_identities(org_id, employee_ref);
CREATE INDEX idx_ei_org_active ON employee_identities(org_id, is_active);

ALTER TABLE employee_identities ENABLE ROW LEVEL SECURITY;

-- RLS: org members can read
CREATE POLICY ei_select ON employee_identities FOR SELECT
    USING (org_id IN (SELECT org_id FROM organisation_members WHERE user_id = auth.uid()));

-- RLS: admin/analyst can write
CREATE POLICY ei_insert ON employee_identities FOR INSERT
    WITH CHECK (org_id IN (SELECT org_id FROM organisation_members WHERE user_id = auth.uid() AND role IN ('admin', 'analyst')));

CREATE POLICY ei_update ON employee_identities FOR UPDATE
    USING (org_id IN (SELECT org_id FROM organisation_members WHERE user_id = auth.uid() AND role IN ('admin', 'analyst')));

CREATE POLICY ei_delete ON employee_identities FOR DELETE
    USING (org_id IN (SELECT org_id FROM organisation_members WHERE user_id = auth.uid() AND role = 'admin'));

-- Link employees to their stable identity
ALTER TABLE employees ADD COLUMN IF NOT EXISTS identity_id UUID REFERENCES employee_identities(id) ON DELETE SET NULL;
CREATE INDEX idx_emp_identity ON employees(identity_id);
