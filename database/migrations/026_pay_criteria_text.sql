-- Migration 026: Add organisation-specific pay criteria description
-- Required for Art. 7(1)(a) EU Directive 2023/970 — employers must describe
-- their ACTUAL objective pay criteria, not generic placeholder text.

ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS pay_criteria_text TEXT DEFAULT NULL;

COMMENT ON COLUMN organisations.pay_criteria_text IS 'Organisation-specific description of objective pay criteria for Art. 7 employee information portal. NULL = not yet configured.';
