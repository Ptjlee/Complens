-- ============================================================
-- Migration 021: Add DELETE policy to employee_pay_overrides
-- H5 fix: analysts couldn't remove overrides they created
-- because no DELETE RLS policy existed (RLS blocks by default)
-- ============================================================

CREATE POLICY "Analysts and admins can delete pay overrides"
    ON employee_pay_overrides FOR DELETE
    USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));
