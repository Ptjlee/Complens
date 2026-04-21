-- ============================================================
-- Migration 027: Job Architecture Module
-- Leveling structures, job families, jobs, competencies,
-- grade mappings, and module enablement flag.
-- ============================================================

-- ============================================================
-- Add module flag to organisations
-- ============================================================

ALTER TABLE organisations
    ADD COLUMN IF NOT EXISTS job_architecture_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN organisations.job_architecture_enabled IS
    'When TRUE the org has booked the Job Architecture add-on (€3.900/yr). '
    'Trial orgs always have access regardless of this flag.';

-- ============================================================
-- TABLE: default_level_definitions
-- Global read-only template (L1-L10). Orgs copy these when
-- initialising their own leveling structure.
-- ============================================================

CREATE TABLE IF NOT EXISTS default_level_definitions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level               TEXT NOT NULL UNIQUE
                            CHECK (level IN ('L1','L2','L3','L4','L5','L6','L7','L8','L9','L10')),
    title_examples      TEXT,
    description         TEXT,
    problem_solving     TEXT,
    accountability      TEXT,
    people_management   TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE default_level_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view default levels"
    ON default_level_definitions FOR SELECT TO authenticated
    USING (TRUE);

-- Seed the 10 universal levels
INSERT INTO default_level_definitions
    (level, title_examples, description, problem_solving, accountability, people_management)
VALUES
    ('L1',  'Support / Intern',
            'Entry-level role focused on learning and performing structured tasks under close supervision.',
            'Follows standard procedures to solve routine problems.',
            'Responsible for own task quality; low impact of error.',
            'No people responsibilities. Works as an individual contributor.'),
    ('L2',  'Junior Professional',
            'Early career professional performing defined tasks with increasing independence.',
            'Solves standard problems using existing solutions or guides.',
            'Accountable for own work; errors detected within team.',
            'No people responsibilities. May guide interns.'),
    ('L3',  'Professional',
            'Fully competent professional working independently on day-to-day tasks.',
            'Solves diverse problems requiring analysis and judgment within scope.',
            'Accountable for project/task outcomes; impact is team-wide.',
            'No formal management. Mentors juniors and new hires.'),
    ('L4',  'Senior Professional',
            'Seasoned professional handling complex tasks and projects with deep expertise.',
            'Solves complex, non-routine problems; proposes new methods.',
            'Accountable for significant project milestones; impact is dept-wide.',
            'May lead small project teams or technically mentor others.'),
    ('L5',  'Lead / Staff',
            'Expert individual contributor or team lead driving area deliverables.',
            'Solves critical, ambiguous problems; defines standards.',
            'Accountable for area results and quality standards.',
            'Leads large projects or small teams (3-5 people).'),
    ('L6',  'Manager / Principal',
            'Manages a team or acts as a principal domain expert.',
            'Solves systemic problems; anticipates future challenges.',
            'Accountable for team delivery, budget input, and performance.',
            'Manages a team (5-10 people) or influences cross-functional groups.'),
    ('L7',  'Senior Manager',
            'Manages multiple teams or a specific function.',
            'Solves strategic problems involving multiple teams/domains.',
            'Accountable for functional goals, budget management, and talent.',
            'Manages managers or large teams (15+ people).'),
    ('L8',  'Director',
            'Leads a department or major functional area.',
            'Solves complex strategic issues with broad organizational impact.',
            'Accountable for departmental strategy, resource allocation, and long-term results.',
            'Leads a department (Managers of Managers).'),
    ('L9',  'VP',
            'Executive leadership for a business unit or division.',
            'Solves enterprise-wide challenges; drives innovation and market position.',
            'Accountable for business unit profit/loss or major function success.',
            'Leads a division or multiple departments.'),
    ('L10', 'C-Level / SVP',
            'Top executive leadership setting company direction.',
            'Solves existential business challenges; defines company vision.',
            'Accountable for total company performance and shareholder value.',
            'Leads the entire organization or major C-suite function.')
ON CONFLICT (level) DO NOTHING;

-- ============================================================
-- TABLE: leveling_structures
-- Per-org container for a set of levels. An org may have
-- multiple structures; exactly one is marked as default.
-- ============================================================

CREATE TABLE IF NOT EXISTS leveling_structures (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    source          TEXT NOT NULL DEFAULT 'custom'
                        CHECK (source IN ('template_l1_l10', 'assistant_generated', 'custom')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, name)
);

CREATE INDEX idx_leveling_structures_org ON leveling_structures(org_id);

CREATE TRIGGER leveling_structures_updated_at
    BEFORE UPDATE ON leveling_structures
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: level_definitions
-- Individual levels within a structure. level_code is flexible
-- (L1-L10, IC1-IC5, M1-M4, E1-E15, TVöD grades, etc.).
-- ============================================================

CREATE TABLE IF NOT EXISTS level_definitions (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id              UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    structure_id        UUID NOT NULL REFERENCES leveling_structures(id) ON DELETE CASCADE,
    level_code          TEXT NOT NULL,
    sort_order          INTEGER NOT NULL DEFAULT 0,
    title_examples      TEXT,
    description         TEXT,
    problem_solving     TEXT,
    accountability      TEXT,
    people_management   TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(structure_id, level_code)
);

CREATE INDEX idx_level_definitions_structure ON level_definitions(structure_id);
CREATE INDEX idx_level_definitions_org       ON level_definitions(org_id);

CREATE TRIGGER level_definitions_updated_at
    BEFORE UPDATE ON level_definitions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: job_families
-- Groups of related jobs (Engineering, Finance, HR, etc.).
-- ============================================================

CREATE TABLE IF NOT EXISTS job_families (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    color           TEXT NOT NULL DEFAULT '#3b82f6',
    icon            TEXT NOT NULL DEFAULT 'briefcase',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, name)
);

CREATE INDEX idx_job_families_org ON job_families(org_id);

CREATE TRIGGER job_families_updated_at
    BEFORE UPDATE ON job_families
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: competencies
-- Shared competency library per org. Each has a 5-level
-- proficiency scale stored as JSONB.
-- ============================================================

CREATE TABLE IF NOT EXISTS competencies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    category        TEXT NOT NULL CHECK (category IN ('technical', 'leadership', 'core', 'functional')),
    description     TEXT,
    levels          JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, name)
);

CREATE INDEX idx_competencies_org ON competencies(org_id);

CREATE TRIGGER competencies_updated_at
    BEFORE UPDATE ON competencies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: jobs
-- Individual job definitions within a family, linked to
-- the org's custom leveling structure and salary bands.
-- ============================================================

CREATE TABLE IF NOT EXISTS jobs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id                  UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    family_id               UUID NOT NULL REFERENCES job_families(id) ON DELETE CASCADE,
    title                   TEXT NOT NULL,
    level_id                UUID REFERENCES level_definitions(id) ON DELETE SET NULL,
    salary_band_grade_id    UUID REFERENCES salary_band_grades(id) ON DELETE SET NULL,

    -- Job description fields (populated manually or by CompLens Assistant)
    jd_summary              TEXT,
    jd_responsibilities     TEXT[],
    jd_qualifications       TEXT[],
    jd_benefits             TEXT[],
    jd_generated_at         TIMESTAMPTZ,

    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    headcount               INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(org_id, family_id, title, level_id)
);

CREATE INDEX idx_jobs_org    ON jobs(org_id);
CREATE INDEX idx_jobs_family ON jobs(family_id);
CREATE INDEX idx_jobs_level  ON jobs(level_id);

CREATE TRIGGER jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: job_competencies
-- Links jobs to required competencies with level & importance.
-- ============================================================

CREATE TABLE IF NOT EXISTS job_competencies (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    competency_id   UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
    required_level  INTEGER NOT NULL CHECK (required_level BETWEEN 1 AND 5),
    importance      TEXT NOT NULL DEFAULT 'important'
                        CHECK (importance IN ('critical', 'important', 'nice_to_have')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(job_id, competency_id)
);

CREATE INDEX idx_job_competencies_job ON job_competencies(job_id);

-- ============================================================
-- TABLE: job_grade_mappings
-- Maps org level definitions to salary band grades.
-- One mapping per (level, salary_band) pair.
-- ============================================================

CREATE TABLE IF NOT EXISTS job_grade_mappings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id              UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    level_id            UUID NOT NULL REFERENCES level_definitions(id) ON DELETE CASCADE,
    salary_band_id      UUID NOT NULL REFERENCES salary_bands(id) ON DELETE CASCADE,
    mapped_grade        TEXT NOT NULL,
    mapped_grade_id     UUID REFERENCES salary_band_grades(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, level_id, salary_band_id)
);

CREATE INDEX idx_job_grade_mappings_org ON job_grade_mappings(org_id);

CREATE TRIGGER job_grade_mappings_updated_at
    BEFORE UPDATE ON job_grade_mappings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE leveling_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_definitions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_families        ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_competencies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_grade_mappings  ENABLE ROW LEVEL SECURITY;

-- ── leveling_structures ──

CREATE POLICY "Members can view their org leveling structures"
    ON leveling_structures FOR SELECT
    USING (org_id = get_user_org_id());

CREATE POLICY "Admins and analysts can insert leveling structures"
    ON leveling_structures FOR INSERT
    WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins and analysts can update leveling structures"
    ON leveling_structures FOR UPDATE
    USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins can delete leveling structures"
    ON leveling_structures FOR DELETE
    USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- ── level_definitions ──

CREATE POLICY "Members can view their org level definitions"
    ON level_definitions FOR SELECT
    USING (org_id = get_user_org_id());

CREATE POLICY "Admins and analysts can insert level definitions"
    ON level_definitions FOR INSERT
    WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins and analysts can update level definitions"
    ON level_definitions FOR UPDATE
    USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins can delete level definitions"
    ON level_definitions FOR DELETE
    USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- ── job_families ──

CREATE POLICY "Members can view their org job families"
    ON job_families FOR SELECT
    USING (org_id = get_user_org_id());

CREATE POLICY "Admins and analysts can insert job families"
    ON job_families FOR INSERT
    WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins and analysts can update job families"
    ON job_families FOR UPDATE
    USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins can delete job families"
    ON job_families FOR DELETE
    USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- ── competencies ──

CREATE POLICY "Members can view their org competencies"
    ON competencies FOR SELECT
    USING (org_id = get_user_org_id());

CREATE POLICY "Admins and analysts can insert competencies"
    ON competencies FOR INSERT
    WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins and analysts can update competencies"
    ON competencies FOR UPDATE
    USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins can delete competencies"
    ON competencies FOR DELETE
    USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- ── jobs ──

CREATE POLICY "Members can view their org jobs"
    ON jobs FOR SELECT
    USING (org_id = get_user_org_id());

CREATE POLICY "Admins and analysts can insert jobs"
    ON jobs FOR INSERT
    WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins and analysts can update jobs"
    ON jobs FOR UPDATE
    USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins can delete jobs"
    ON jobs FOR DELETE
    USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- ── job_competencies ──

CREATE POLICY "Members can view their org job competencies"
    ON job_competencies FOR SELECT
    USING (org_id = get_user_org_id());

CREATE POLICY "Admins and analysts can insert job competencies"
    ON job_competencies FOR INSERT
    WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins and analysts can update job competencies"
    ON job_competencies FOR UPDATE
    USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins can delete job competencies"
    ON job_competencies FOR DELETE
    USING (org_id = get_user_org_id() AND get_user_role() = 'admin');

-- ── job_grade_mappings ──

CREATE POLICY "Members can view their org grade mappings"
    ON job_grade_mappings FOR SELECT
    USING (org_id = get_user_org_id());

CREATE POLICY "Admins and analysts can insert grade mappings"
    ON job_grade_mappings FOR INSERT
    WITH CHECK (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins and analysts can update grade mappings"
    ON job_grade_mappings FOR UPDATE
    USING (org_id = get_user_org_id() AND get_user_role() IN ('admin', 'analyst'));

CREATE POLICY "Admins can delete grade mappings"
    ON job_grade_mappings FOR DELETE
    USING (org_id = get_user_org_id() AND get_user_role() = 'admin');
