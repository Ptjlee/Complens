-- ============================================================
-- PayLens — Overtime & benefits in kind
-- Migration: 005_additional_compensation.sql
-- EU Directive 2023/970 Art. 3: "remuneration" includes all
-- cash and in-kind components paid in connection with work.
-- ============================================================

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS overtime_pay      NUMERIC(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS benefits_in_kind  NUMERIC(12,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN employees.overtime_pay     IS 'Annual overtime / extra hours compensation (cash, gross)';
COMMENT ON COLUMN employees.benefits_in_kind IS 'Annual value of non-cash benefits: company car, meal vouchers, etc.';
