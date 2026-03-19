-- ============================================================
-- Migration 018: Add legal fields to organisations
--               Required for contract generation
-- ============================================================

-- Legal representative (Geschäftsführer / Vertretungsberechtigte)
-- Legal address (Registered office / Firmensitz)

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS legal_representative TEXT,
  ADD COLUMN IF NOT EXISTS legal_address        TEXT,
  ADD COLUMN IF NOT EXISTS legal_city           TEXT,
  ADD COLUMN IF NOT EXISTS legal_zip            TEXT,
  ADD COLUMN IF NOT EXISTS vat_id               TEXT;
