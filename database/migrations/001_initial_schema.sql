-- ============================================================
-- PayLens — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Run in: Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled in Supabase by default, but just in case)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE subscription_plan AS ENUM (
  'trial',        -- 7-day free trial (full PayLens AI access)
  'free',         -- Permanent free tier (≤10 employees, no export)
  'paylens',      -- €4,490/yr — manual import only
  'paylens_ai'    -- €4,990/yr — AI column mapping + narratives
);

CREATE TYPE member_role AS ENUM (
  'admin',    -- Full access, billing, user management
  'analyst',  -- Run analyses, view reports — no billing
  'viewer'    -- Read-only — for auditors / Betriebsrat
);

CREATE TYPE dataset_status AS ENUM (
  'uploading',   -- File upload in progress
  'mapping',     -- Column mapping in progress (AI or manual)
  'ready',       -- Mapped and validated, ready to analyse
  'error'        -- Upload or mapping failed
);

CREATE TYPE analysis_status AS ENUM (
  'pending',
  'running',
  'complete',
  'error'
);

CREATE TYPE gender AS ENUM (
  'male',
  'female',
  'non_binary',
  'not_specified'
);

CREATE TYPE employment_type AS ENUM (
  'full_time',
  'part_time',
  'temporary',
  'apprentice'
);

-- ============================================================
-- TABLE: organisations
-- One row per paying tenant. The tenant_id is this row's id.
-- ============================================================

CREATE TABLE organisations (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT NOT NULL,                          -- Company name
  slug                    TEXT UNIQUE NOT NULL,                   -- URL-safe identifier
  plan                    subscription_plan NOT NULL DEFAULT 'trial',
  trial_ends_at           TIMESTAMPTZ,                            -- NULL = not on trial
  stripe_customer_id      TEXT UNIQUE,                            -- Stripe customer object
  stripe_subscription_id  TEXT UNIQUE,                            -- Stripe subscription object
  subscription_ends_at    TIMESTAMPTZ,                            -- Current period end
  max_users               INT NOT NULL DEFAULT 1,                 -- Base licence = 1 user
  data_retention_years    INT NOT NULL DEFAULT 3,                 -- GDPR retention (default 3yr)
  ai_enabled              BOOLEAN NOT NULL DEFAULT false,         -- Only true for paylens_ai
  country                 TEXT NOT NULL DEFAULT 'DE',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: keep updated_at current
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organisations_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: organisation_members
-- Links Supabase auth.users to an organisation with a role.
-- ============================================================

CREATE TABLE organisation_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        member_role NOT NULL DEFAULT 'analyst',
  invited_by  UUID REFERENCES auth.users(id),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_user ON organisation_members(user_id);
CREATE INDEX idx_org_members_org  ON organisation_members(org_id);

-- ============================================================
-- TABLE: datasets
-- One row per uploaded file. Raw file is NEVER stored —
-- only metadata and column mapping results.
-- ============================================================

CREATE TABLE datasets (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  uploaded_by         UUID NOT NULL REFERENCES auth.users(id),
  name                TEXT NOT NULL,                   -- User-facing name (e.g. "Gehaltsrunde 2025")
  reporting_year      INT NOT NULL,                    -- The year this dataset covers
  file_hash           TEXT NOT NULL,                   -- SHA-256 of original file (audit trail)
  file_name           TEXT NOT NULL,                   -- Original filename (e.g. "lohnliste_q1.xlsx")
  file_type           TEXT NOT NULL,                   -- 'csv' | 'xlsx' | 'ods'
  employee_count      INT,                             -- Row count after validation
  status              dataset_status NOT NULL DEFAULT 'uploading',
  ai_mapping_used     BOOLEAN NOT NULL DEFAULT false,  -- Was AI column mapping used?
  ai_gdpr_consent     BOOLEAN NOT NULL DEFAULT false,  -- Did user consent before AI call?
  column_mapping      JSONB,                           -- { "Abteilung": "department", "Gehalt": "salary_base", ... }
  mapping_confidence  JSONB,                           -- { "department": 0.97, "salary_base": 0.89, ... }
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_datasets_org  ON datasets(org_id);
CREATE INDEX idx_datasets_year ON datasets(org_id, reporting_year);

CREATE TRIGGER datasets_updated_at
  BEFORE UPDATE ON datasets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: employees
-- Processed employee records, referenced per dataset.
-- Names are OPTIONAL — users may upload IDs only (GDPR).
-- ============================================================

CREATE TABLE employees (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id        UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  org_id            UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  -- Identity (all optional — user may use IDs only)
  employee_ref      TEXT,               -- Employee ID or any opaque reference
  gender            gender NOT NULL,

  -- Pay
  salary_base       NUMERIC(12,2) NOT NULL,     -- Annual base salary (gross)
  salary_variable   NUMERIC(12,2) DEFAULT 0,   -- Bonus / variable pay (annual)

  -- Wage Influencing Factors (WIFs)
  job_title         TEXT,
  department        TEXT,
  job_grade         TEXT,              -- e.g. "L3", "Band 5", "AT"
  employment_type   employment_type NOT NULL DEFAULT 'full_time',
  fte_ratio         NUMERIC(4,3) DEFAULT 1.0,   -- 1.0 = full-time; 0.5 = 50% part-time
  hire_date         DATE,
  seniority_years   NUMERIC(5,2),      -- Derived from hire_date or manually set
  location          TEXT,

  -- Custom WIFs (user-definable key-value pairs)
  custom_wifs       JSONB DEFAULT '{}',

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_dataset ON employees(dataset_id);
CREATE INDEX idx_employees_org     ON employees(org_id);
CREATE INDEX idx_employees_dept    ON employees(org_id, department);
CREATE INDEX idx_employees_grade   ON employees(org_id, job_grade);

-- ============================================================
-- TABLE: analyses
-- One row per pay gap analysis run. Stores all computed
-- results as JSONB so no schema changes needed as we add metrics.
-- ============================================================

CREATE TABLE analyses (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id              UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  dataset_id          UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  run_by              UUID NOT NULL REFERENCES auth.users(id),
  name                TEXT NOT NULL,       -- User-facing label (e.g. "Analyse 2025 — final")
  status              analysis_status NOT NULL DEFAULT 'pending',

  -- Top-level results (denormalised for fast dashboard queries)
  gap_unadjusted_mean    NUMERIC(6,4),     -- e.g. 0.1234 = 12.34%
  gap_unadjusted_median  NUMERIC(6,4),
  gap_adjusted_mean      NUMERIC(6,4),
  gap_adjusted_median    NUMERIC(6,4),
  exceeds_5pct_threshold BOOLEAN,          -- EU Directive Article 9 flag

  -- Full results payload (structured JSON)
  -- Shape: { overall, by_department, by_grade, quartiles, variable_pay, trend }
  results             JSONB,

  -- WIF configuration used for this run
  wif_config          JSONB,               -- { "factors": ["job_grade", "employment_type", "location"] }

  -- Report generation
  report_pdf_path     TEXT,               -- Supabase Storage path
  report_ppt_path     TEXT,               -- Supabase Storage path
  report_xml_path     TEXT,               -- EU machine-readable XML path

  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analyses_org     ON analyses(org_id);
CREATE INDEX idx_analyses_dataset ON analyses(dataset_id);

CREATE TRIGGER analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: onboarding_progress
-- Tracks where each user is in the onboarding flow.
-- ============================================================

CREATE TABLE onboarding_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  current_step    INT NOT NULL DEFAULT 1,   -- 1=welcome, 2=upload, 3=first_analysis, 4=report
  completed_at    TIMESTAMPTZ,              -- NULL = not yet complete
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- ============================================================
-- HELPER FUNCTION: get user's org_id (used in RLS policies)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM organisation_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS member_role AS $$
  SELECT role FROM organisation_members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE organisations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees              ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress    ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- organisations: users can only see their own org
-- --------------------------------------------------------
CREATE POLICY "Members can view their own organisation"
  ON organisations FOR SELECT
  USING (id = get_user_org_id());

CREATE POLICY "Admins can update their organisation"
  ON organisations FOR UPDATE
  USING (id = get_user_org_id() AND get_user_role() = 'admin');

-- --------------------------------------------------------
-- organisation_members: members see their own org's members
-- --------------------------------------------------------
CREATE POLICY "Members can view their org's members"
  ON organisation_members FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Admins can insert members"
  ON organisation_members FOR INSERT
  WITH CHECK (org_id = get_user_org_id() AND get_user_role() = 'admin');

CREATE POLICY "Admins can delete members"
  ON organisation_members FOR DELETE
  USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- --------------------------------------------------------
-- datasets: all members read; analysts/admins write
-- --------------------------------------------------------
CREATE POLICY "Members can view their org's datasets"
  ON datasets FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Analysts and admins can insert datasets"
  ON datasets FOR INSERT
  WITH CHECK (
    org_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'analyst')
  );

CREATE POLICY "Analysts and admins can update datasets"
  ON datasets FOR UPDATE
  USING (
    org_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'analyst')
  );

CREATE POLICY "Admins can delete datasets"
  ON datasets FOR DELETE
  USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- --------------------------------------------------------
-- employees: all members read; analysts/admins write
-- Viewers cannot export raw records (enforced in app layer)
-- --------------------------------------------------------
CREATE POLICY "Members can view employees in their org"
  ON employees FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Analysts and admins can insert employees"
  ON employees FOR INSERT
  WITH CHECK (
    org_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'analyst')
  );

CREATE POLICY "Admins can delete employee records"
  ON employees FOR DELETE
  USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- --------------------------------------------------------
-- analyses: all members read; analysts/admins write
-- --------------------------------------------------------
CREATE POLICY "Members can view their org's analyses"
  ON analyses FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "Analysts and admins can create analyses"
  ON analyses FOR INSERT
  WITH CHECK (
    org_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'analyst')
  );

CREATE POLICY "Analysts and admins can update analyses"
  ON analyses FOR UPDATE
  USING (
    org_id = get_user_org_id()
    AND get_user_role() IN ('admin', 'analyst')
  );

-- --------------------------------------------------------
-- onboarding_progress: each user sees/writes only their own
-- --------------------------------------------------------
CREATE POLICY "Users can view their own onboarding progress"
  ON onboarding_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own onboarding progress"
  ON onboarding_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own onboarding progress"
  ON onboarding_progress FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- POST-SIGNUP TRIGGER
-- When a new user signs up via Supabase Auth, we have no org
-- yet — the Next.js signup action creates the org and member
-- row via the service role key (bypasses RLS).
-- This trigger is a safety net to ensure updated_at stays fresh.
-- ============================================================

-- (No auth trigger needed here — org creation is handled in
--  apps/web/src/app/(auth)/actions.ts via the service role client)

-- ============================================================
-- DONE
-- ============================================================
-- Tables created:
--   organisations, organisation_members, datasets,
--   employees, analyses, onboarding_progress
--
-- RLS enabled on all tables.
-- Helper functions: get_user_org_id(), get_user_role()
-- Updated_at triggers on: organisations, datasets, analyses
-- ============================================================
