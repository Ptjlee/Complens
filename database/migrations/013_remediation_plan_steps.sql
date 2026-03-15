-- ============================================================
-- Migration 013: Multi-step remediation plans
-- Adds a plan_steps JSONB column to remediation_plans so that
-- each employee can have a phased action plan (3–5 steps) with
-- distinct time horizons instead of a single monolithic action.
-- ============================================================

ALTER TABLE remediation_plans
    ADD COLUMN IF NOT EXISTS plan_steps JSONB NOT NULL DEFAULT '[]';

-- Each element of plan_steps follows this shape (enforced at app level):
-- {
--   "id":           "uuid-v4",          -- client-generated UUID
--   "step_number":  1,                  -- 1-based
--   "action_type":  "salary_increase",  -- ActionType enum
--   "description":  "...",              -- free-text description
--   "horizon":      "6m",               -- "6m" | "1y" | "1.5y" | "2-3y"
--   "target_salary": null | number,     -- annual EUR target (optional)
--   "responsible":  "HR-Leitung",
--   "notes":        "...",
--   "status":       "open"              -- PlanStatus enum
-- }

COMMENT ON COLUMN remediation_plans.plan_steps IS
    'Ordered array of phased action steps (3–5 recommended). '
    'Each step has: id, step_number, action_type, description, '
    'horizon (6m|1y|1.5y|2-3y), target_salary, responsible, notes, status.';
