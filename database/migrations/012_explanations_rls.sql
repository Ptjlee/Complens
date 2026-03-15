-- ============================================================
-- PayLens — Row-level security for pay_gap_explanations
-- Migration: 012_explanations_rls.sql
--
-- 006/007 created the table and added columns but omitted RLS.
-- Without policies the authenticated Supabase client cannot
-- SELECT rows, so saved explanations silently disappeared on
-- page reload.  This migration fixes that permanently.
-- ============================================================

ALTER TABLE pay_gap_explanations ENABLE ROW LEVEL SECURITY;

-- Members of the owning org may read explanations
CREATE POLICY "Members can view their org's explanations"
    ON pay_gap_explanations FOR SELECT
    USING (org_id = get_user_org_id());

-- Members may insert / update explanations for their org
CREATE POLICY "Members can upsert their org's explanations"
    ON pay_gap_explanations FOR INSERT
    WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Members can update their org's explanations"
    ON pay_gap_explanations FOR UPDATE
    USING  (org_id = get_user_org_id())
    WITH CHECK (org_id = get_user_org_id());

-- Only admins / the creating member should delete; keep simple for now
CREATE POLICY "Members can delete their org's explanations"
    ON pay_gap_explanations FOR DELETE
    USING (org_id = get_user_org_id());
