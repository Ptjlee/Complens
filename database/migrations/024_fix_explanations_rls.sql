-- Migration 024: Restrict pay_gap_explanations RLS for viewer/Betriebsrat roles
-- viewer and betriebsrat roles should only have SELECT access, not INSERT/UPDATE/DELETE.

-- Enable RLS on the table (idempotent)
ALTER TABLE pay_gap_explanations ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "explanations_select_org_members" ON pay_gap_explanations;
DROP POLICY IF EXISTS "explanations_insert_admin_hr" ON pay_gap_explanations;
DROP POLICY IF EXISTS "explanations_update_admin_hr" ON pay_gap_explanations;
DROP POLICY IF EXISTS "explanations_delete_admin" ON pay_gap_explanations;

-- SELECT: all org members can read explanations for their org
CREATE POLICY "explanations_select_org_members"
ON pay_gap_explanations FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
);

-- INSERT: only admin and hr roles can create explanations
CREATE POLICY "explanations_insert_admin_hr"
ON pay_gap_explanations FOR INSERT
WITH CHECK (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'hr')
    )
);

-- UPDATE: only admin and hr roles can update explanations
CREATE POLICY "explanations_update_admin_hr"
ON pay_gap_explanations FOR UPDATE
USING (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'hr')
    )
);

-- DELETE: only admin role can delete explanations
CREATE POLICY "explanations_delete_admin"
ON pay_gap_explanations FOR DELETE
USING (
    org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);
