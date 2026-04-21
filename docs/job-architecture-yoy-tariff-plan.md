# Job Architecture: Year-over-Year Carryover & Salary Band / Tariff Integration

## Context

PayLens serves German HR teams complying with the EU Pay Transparency Directive (EPTD 2023/970). The job architecture module lets organizations define leveling frameworks, job families, and map employees to positions. Two structural gaps limit its value for year-over-year use:

1. **No assignment carryover.** Each dataset upload creates new employee records (new UUIDs). Despite `employee_ref` (Personalnummer) being consistent across years, the system has no mechanism to carry forward confirmed assignments. With ~85-90% workforce stability, this forces unnecessary re-mapping every year.

2. **Loose salary band / tariff integration.** Multiple salary bands per org exist, but there is no formal tariff entity, no employee-level tariff assignment, no Stufen (seniority steps), and no tariff-scoped analysis. For German organizations with TVöD, ERA, Haustarif, and AT employees coexisting, this produces misleading cross-tariff pay gap comparisons.

Both gaps also create **compliance risk**: EPTD Art. 9 requires consistent worker categories for annual reporting, Art. 10 requires tracking progress on 5%+ gaps, and EntgTranspG §4 requires comparisons within the relevant pay structure.

---

## Workstream A: Year-over-Year Assignment Carryover

### A1. Schema Changes

**New table: `employee_identities`** — stable anchor across datasets

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| org_id | UUID FK organisations | |
| employee_ref | TEXT NOT NULL | Personalnummer — canonical key |
| canonical_name | TEXT | `"last_name, first_name"` for display |
| first_seen_dataset_id | UUID FK datasets | |
| last_seen_dataset_id | UUID FK datasets | |
| is_active | BOOLEAN DEFAULT TRUE | |
| UNIQUE(org_id, employee_ref) | | |

**New column on `employees`:** `identity_id UUID FK employee_identities`

**New table: `assignment_carryovers`** — audit trail

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| org_id | UUID FK | |
| target_dataset_id | UUID FK datasets | new year |
| source_dataset_id | UUID FK datasets | previous year |
| identity_id | UUID FK employee_identities | |
| target_employee_id | UUID FK employees | |
| source_employee_id | UUID FK employees | |
| carried_job_id | UUID FK jobs | |
| match_method | TEXT | `'employee_ref'`, `'name_department'`, `'name_only'` |
| match_confidence | NUMERIC(4,2) | |
| change_flags | JSONB | `{"title_changed": true, "grade_changed": false, ...}` |
| status | TEXT | `'proposed'` / `'accepted'` / `'rejected'` / `'reassigned'` |
| reviewed_by | UUID FK auth.users | |
| reviewed_at | TIMESTAMPTZ | |

**Expand `employee_job_assignments.source` CHECK** to include `'carryover'`.

### A2. Identity Resolution (3-tier)

| Tier | Method | Confidence | When |
|------|--------|------------|------|
| 1 | `employee_ref` exact match | 0.95-1.0 | Both datasets have ref (Personalnummer) |
| 2 | `last_name + first_name + department` | 0.75-0.85 | Ref missing; name+dept match |
| 3 | `last_name + first_name` only | 0.55-0.65 | Dept changed; name-only fallback |

Identity linking runs during dataset import: for each new employee row, find or create an `employee_identities` record.

### A3. Carryover Logic

**Trigger:** User clicks "Zuordnungen übernehmen" in HeadcountTab (not automatic on import — compliance requires explicit user action).

**Flow:**
1. Select source dataset (default: most recent with confirmed assignments)
2. Match employees via identity table
3. For each matched identity with a prior confirmed assignment:
   - Compare `job_title`, `department`, `job_grade` between old and new employee records
   - If unchanged → auto-confirm (`status = 'accepted'`, `source = 'carryover'`)
   - If changed → propose (`status = 'proposed'`) and flag what changed
4. Unmatched employees in new dataset → "new hires" (no carryover, route to auto-map)
5. Prior-year identities not in new dataset → "leavers" (informational only)

### A4. UX Flow

**HeadcountTab changes:**
- New card above auto-map: "Zuordnungen übernehmen" — appears when a prior dataset with assignments exists
- Shows: source dataset name, number of carryable assignments
- Dropdown to select source dataset

**Carryover Review (adapts AutoMapReview pattern):**
- Summary bar: `387 übernommen | 12 geändert | 38 neue MA | 13 ausgeschieden`
- Default filter: show "geändert" (changed) rows first for review
- "Übernommen" rows collapsed by default with count badge
- Actions on changed rows: accept prior assignment / override with different job / reject
- "Neue MA" section: button to chain into auto-mapping for new hires only
- For accepted rows, show green "✓ Übernommen" with prior-year reference

**Edge cases:**
- Job deactivated since last year → flag: "Stelle inaktiv — bitte neu zuordnen"
- Bulk department rename detected (>50% same pattern) → suggest bulk acceptance
- No `employee_ref` on some employees → warning banner with count
- Carryover re-run → skip already-assigned employees

### A5. Audit Trail

Every carryover writes to `assignment_carryovers` with full traceability. The `assignment_change_log` (or the carryover table itself) captures: who triggered, when, match method, what changed, decision taken. This satisfies:
- EPTD Art. 10 (tracking gap remediation progress)
- BetrVG §80(2) (Betriebsrat verification rights)
- GDPR Art. 5(2) (accountability principle)

---

## Workstream B: Salary Band / Tariff Integration

### B0. Design Principle: Protect the Existing Salary Band Module

The current salary band module is a complete, production-ready feature for corporate/non-tariff organizations:

**Existing capabilities (must NOT be disrupted):**
- **Internal bands**: auto-computed from employee data (min, P25, median, P75, max + gender breakdown) via `computeInternalBands()` in `getBandContext.ts`
- **External market benchmarks**: per-grade P25/P50/P75 from sources like Kienbaum, Radford, Stepstone via `salary_band_market_data` table and `upsertMarketBenchmark()`
- **Compa-ratios**: internal median vs. band midpoint, internal vs. market P50 (color-coded red/green/purple)
- **Visualization**: box plots with gender overlays, target band ranges, market P25-P75 bands (base vs. total comp toggle)
- **EU Art. 9 compliance heatmap**: intra-grade gender gap ≥5% flagging with `exceeds_5pct` flag
- **One-click band creation**: detect grades from employee data → create band → compute stats in one action (`createBandFromDetectedGrades()`)
- **Dataset switching**: recompute internal bands against a different dataset without recreating the band
- **Manual band management**: SalaryBandsPanel in Settings for manual grade/salary range entry

**Design rule: tariff is an optional overlay, not a required wrapper.** All `tariff_id` columns are nullable. Organizations that don't use tariffs see zero UI changes — their bands, benchmarks, compa-ratios, and visualizations work exactly as today. The tariff layer activates only when explicitly configured.

### B1. Tariff as an Optional Grouping Layer

**New table: `tariff_structures`** — optional grouping for orgs with collective agreements

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| org_id | UUID FK | |
| name | TEXT NOT NULL | "TVöD VKA", "ERA NRW", "Haustarif XYZ" |
| tariff_type | TEXT | `'tvoed'`, `'tv_l'`, `'era'`, `'haustarif'`, `'at'`, `'custom'` |
| is_binding | BOOLEAN | Legally binding (Tarifvertrag) vs. voluntary |
| is_default | BOOLEAN DEFAULT FALSE | Default for unassigned employees |
| is_active | BOOLEAN DEFAULT TRUE | |
| valid_from | DATE | Tariff period start |
| valid_until | DATE | Tariff period end |
| UNIQUE(org_id, name) | | |

**New nullable columns:**
- `salary_bands.tariff_id UUID FK tariff_structures NULL` — groups bands under a tariff
- `employees.tariff_id UUID FK tariff_structures NULL` — which tariff applies to this employee
- `job_grade_mappings.tariff_id UUID FK tariff_structures NULL` — scopes grade mapping to a tariff

**What stays the same for non-tariff orgs:**
- `salary_bands` without `tariff_id` work exactly as today
- `salary_band_grades` untouched — internal stats, market benchmarks, compa-ratios unchanged
- `salary_band_market_data` untouched — external benchmarks independent of tariffs
- `computeInternalBands()` unchanged — groups employees by grade regardless of tariff
- `BandVisualizationChart`, `ComplianceHeatmap` unchanged
- `SalaryBandsPanel` unchanged — manual band creation continues to work
- One-click band creation flow unchanged

**What activates for tariff orgs:**
- Bands can optionally be grouped under a tariff structure
- Auto-mapping can filter grade mappings by tariff (reducing cross-tariff mismatches)
- Pay gap analysis can group by `(tariff_id, job_grade)` for within-tariff comparison
- GradeMappingTab gains an optional tariff filter

**Migration path:** No auto-migration of existing data. Existing bands stay `tariff_id = NULL`. Organizations opt in by creating tariff structures and linking their bands. Zero disruption.

### B2. Stufen (Seniority Steps) — Additive Table

**New table: `salary_band_steps`** — optional, for TVöD/ERA orgs

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| grade_id | UUID FK salary_band_grades | |
| step_number | INTEGER | Stufe 1, 2, 3... |
| step_label | TEXT | "Stufe 1", "Erfahrungsstufe 3" |
| min_years | NUMERIC(4,1) | Years in grade to reach step |
| salary_amount | NUMERIC(12,2) | Gross annual for this step |
| UNIQUE(grade_id, step_number) | | |

**New nullable column on `employees`:** `tariff_step INTEGER NULL`

**Impact on existing features:**
- `computeInternalBands()` stays unchanged — it groups by grade, not by step
- If Stufen data exists, it becomes available as a WIF factor in pay gap analysis (explaining within-grade differences)
- Non-tariff orgs never see Stufen UI — it only appears when a band has steps defined
- Market benchmarks stay grade-level (P25/P50/P75 per grade, not per step) — this is how market data is published

### B3. AT (außertariflich) Handling

- Dedicated `tariff_structures` entry with `tariff_type = 'at'`
- `employees` with AT grades get `tariff_id` pointing to the AT structure
- Pay gap analysis: AT employees can be analyzed as a separate cohort
- EntgTranspG §5(3): AT comparison group = highest tariff grade or AT peer group
- Non-tariff orgs: no AT concept needed — all employees are effectively "internal grade" employees

### B4. Impact on Auto-Mapping (Backward Compatible)

Add tariff filter to `matchEmployee()` in `autoMapAction.ts`:

```
// Before grade matching — falls through when tariff is not set:
const relevantMappings = gradeMappings.filter(gm =>
    !emp.tariff_id || !gm.tariff_id || gm.tariff_id === emp.tariff_id
)
```

When `emp.tariff_id` is NULL (non-tariff org), ALL grade mappings are considered — identical to current behavior. Only when both employee and mapping have tariff IDs does filtering activate.

### B5. Tariff Detection During Import

Extend existing `detectNamingScheme()` to also return a `tariff_type`. During import:
- If org has no tariff structures → skip entirely (current flow unchanged)
- If org has exactly one matching tariff → auto-assign
- If multiple or ambiguous → prompt user to assign per employee group

### B6. UX Changes (Non-Breaking)

**GradeMappingTab: no rename.** Keep "Vergütungsstufenzuordnung" as the tab name. If the org has tariff structures, add an optional tariff filter dropdown above the grid. If no tariffs → no change to the UI.

**AutoMapReviewTable — optional "Band" column:**
- Shows band name + grade + salary range for each employee (from existing `ctx.gradeMappings` + `ctx.salaryBands`)
- Only shown when salary bands are configured (already available in context)
- Warning icon if grade has no mapping (configuration gap)

**JobModal — richer band context:**
- When level is selected, show: mapped grades as chips, salary range, headcount at level
- Uses existing data in `ctx` — no new queries needed

**SalaryBandModuleClient — optional tariff section:**
- If org has tariff structures: show a tariff grouping header above each band group
- If no tariffs: exactly the current view (bands listed flat, internal stats, market benchmarks, visualizations)

### B7. Pay Gap Analysis Impact (Additive)

- **Default (no tariffs):** group by `job_grade` as today — unchanged
- **With tariffs:** additionally support grouping by `(tariff_id, job_grade)` for within-tariff comparison
- Add `tariff_id` and `tariff_step` as optional WIF factors (selectable in analysis config)
- AT employees optionally excludable from tariff analysis
- Cross-tariff org-wide gap still computed for EPTD Art. 9 reporting

### B8. What This Means for Different Org Types

| Org Type | Tariff Structures | What Changes | What Stays Same |
|----------|-------------------|-------------|-----------------|
| **Corporate (no tariff)** — G1-G10, Band A-E, custom grades | None created | Nothing | Everything: internal bands, market benchmarks, compa-ratios, visualizations, one-click creation |
| **Public sector** — TVöD/TV-L | 1-2 tariffs created | Grade mappings filterable by tariff; Stufen available as WIF factor; within-tariff gap analysis | Internal band computation, market benchmarks, box plots, compliance heatmap |
| **Manufacturing** — ERA + Haustarif | 2+ tariffs created | Employee-level tariff assignment; tariff-scoped auto-mapping; separate AT cohort | All existing salary band features |
| **Mixed** — some tariff, some internal | Tariffs for covered groups; internal band for others | Tariff filter on grade mappings; AT handling | Non-tariff employees use bands exactly as today |

---

## Workstream C: Module Clarity & Greenfield Onboarding

### C0. The Problem

Some organizations come to PayLens with **no structure at all** — no leveling framework, no job families, no salary bands, no job catalog. They need to build everything from scratch to become EPTD-compliant. Today, the two modules (Salary Bands and Job Architecture) exist independently with no guided workflow connecting them:

- **Salary Band module** (`/dashboard/salary-bands`) — focuses on compensation: internal band stats from employee data, external market benchmarks, compa-ratios, gender gap heatmap
- **Job Architecture module** (`/dashboard/job-architecture`) — focuses on organizational structure: leveling (L1-L10), job families, job catalog, competencies, grade mappings, employee-to-job assignment

Users can stumble into either module first and get confused about what to do where. The grade mapping tab in Job Architecture connects the two, but there's no explanation of why or when.

### C1. Design Principle: Two Modules, Clear Purposes, Clear Sequence

| Module | Purpose | Input | Output |
|--------|---------|-------|--------|
| **Salary Bands** | "What do we currently pay?" | Payroll data (dataset upload) | Internal band statistics, market comparison, gender gaps per grade |
| **Job Architecture** | "How should work be organized?" | Organizational design decisions | Leveling framework, job catalog, employee-to-job mapping |

**The bridge:** Grade Mapping connects the two. It says: "Level L4 in our job architecture corresponds to salary grade E11 in our TVöD band."

**The sequence for a greenfield org:**

```
Step 1: Upload payroll data (Datasets)
        → Creates employee records with grades, titles, salaries

Step 2: Salary Bands → "Bänder erkennen" (one-click)
        → Detects grades, computes internal statistics
        → Immediate insight: "Here's what you're actually paying"

Step 3: Job Architecture → Leveling (create or use L1-L10 template)
        → Defines responsibility levels for the organization

Step 4: Job Architecture → Familien & Stellen (create job families + jobs)
        → Builds the job catalog

Step 5: Job Architecture → Vergütungsstufenzuordnung (grade mapping)
        → Links levels to salary band grades
        → This is where the two modules meet

Step 6: Job Architecture → Stellenbesetzung (headcount/auto-map)
        → Maps employees to jobs using grade mappings

Step 7: Run pay gap analysis
        → Meaningful because employees are now categorized
```

### C2. Contextual Guidance (In-Module Notes)

**Job Architecture module — page-level guidance:**
When the module has no data (first visit), show a guided introduction card:

> **Stellenarchitektur aufbauen**
> 
> Das Stellenarchitektur-Modul hilft Ihnen, eine transparente Organisationsstruktur aufzubauen — eine Voraussetzung für die EU-Entgelttransparenzrichtlinie.
>
> **Empfohlene Reihenfolge:**
> 1. **Einstufung** — Definieren Sie Verantwortungsstufen (L1–L10 Vorlage verfügbar)
> 2. **Familien & Stellen** — Erstellen Sie Stellenfamilien und ordnen Sie Positionen zu
> 3. **Vergütungsstufenzuordnung** — Verknüpfen Sie Stufen mit Ihren Vergütungsgruppen
> 4. **Stellenbesetzung** — Ordnen Sie Mitarbeitende den Positionen zu
>
> **Tipp:** Haben Sie bereits Vergütungsbänder eingerichtet? Die Vergütungsstufenzuordnung verbindet Ihr Stellenarchitektur mit Ihren Gehaltsbändern.

**Salary Band module — guidance for greenfield:**
When bands have been computed but Job Architecture is empty, show a hint:

> **Nächster Schritt: Stellenarchitektur**
>
> Ihre Vergütungsbänder zeigen, was Sie aktuell zahlen. Um Mitarbeitende für die Entgelttransparenz-Analyse korrekt zu kategorisieren, benötigen Sie eine Stellenarchitektur.
> → [Zum Stellenarchitektur-Modul](/dashboard/job-architecture)

**Grade Mapping tab — bridge explanation:**
At the top of the GradeMappingTab, always show an info note:

> **Vergütungsstufenzuordnung** verbindet Ihre Verantwortungsstufen (Stellenarchitektur) mit Ihren Vergütungsgruppen (Gehaltsbänder). Diese Zuordnung wird für die automatische Mitarbeiter-Stellenzuordnung verwendet.

**HeadcountTab — prerequisite check:**
When no grade mappings exist, show a warning before auto-mapping:

> **Vergütungsstufenzuordnung fehlt.** Die automatische Zuordnung benötigt eine Verknüpfung zwischen Verantwortungsstufen und Vergütungsgruppen. → [Vergütungsstufenzuordnung einrichten](/dashboard/job-architecture?tab=gradeMapping)

### C3. Module Relationship Diagram (for internal documentation)

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│     SALARY BANDS            │     │     JOB ARCHITECTURE         │
│                             │     │                              │
│  salary_bands               │     │  leveling_structures         │
│    └─ salary_band_grades    │     │    └─ level_definitions      │
│         └─ market_data      │     │  job_families                │
│         └─ internal stats   │     │    └─ jobs                   │
│                             │     │  competencies                │
│  "What do we pay?"          │     │  "How is work organized?"    │
└──────────┬──────────────────┘     └──────────┬───────────────────┘
           │                                   │
           │      ┌─────────────────────┐      │
           └──────┤  GRADE MAPPING      ├──────┘
                  │  (the bridge)       │
                  │                     │
                  │  level_id ←→ grade  │
                  └─────────┬───────────┘
                            │
                  ┌─────────┴───────────┐
                  │  EMPLOYEE MAPPING   │
                  │  (headcount tab)    │
                  │                     │
                  │  employee → job     │
                  │  (via grade match)  │
                  └─────────────────────┘
```

### C4. Empty-State Guidance per Tab

| Tab | Empty State Message | Action |
|-----|-------------------|--------|
| Leveling | "Definieren Sie Verantwortungsstufen für Ihre Organisation. Sie können die L1–L10-Vorlage verwenden oder eine eigene Struktur erstellen." | [L1–L10 Vorlage verwenden] button |
| Familien & Stellen | "Erstellen Sie Stellenfamilien, um Ihre Positionen zu gruppieren (z.B. Finance, Engineering, HR)." | [Erste Stellenfamilie erstellen] button |
| Vergütungsstufenzuordnung | "Verknüpfen Sie Ihre Verantwortungsstufen mit Vergütungsgruppen. Voraussetzung: mindestens eine Einstufungsstruktur und ein Vergütungsband." | Links to both modules if prerequisites missing |
| Stellenbesetzung | "Ordnen Sie Mitarbeitende aus Ihrem Datensatz den definierten Stellen zu." | Dataset selector + auto-map or carryover |
| Competencies | "Definieren Sie Kompetenzen und ordnen Sie diese Stellen zu, um gleichwertige Arbeit objektiv zu bewerten." | [Erste Kompetenz erstellen] button |

### C5. Prerequisite Awareness

The system should track and surface readiness across both modules:

**Job Architecture readiness indicators (show in module header):**
- ☐ Leveling structure created
- ☐ At least 1 job family created
- ☐ At least 1 job defined
- ☐ Grade mappings configured
- ☐ Employees mapped to jobs

**Salary Band readiness indicators:**
- ☐ At least 1 salary band created
- ☐ Internal bands computed (from dataset)
- ☐ Market benchmarks added (optional but recommended)

**Analysis readiness (show on analysis page):**
- ☐ Dataset uploaded
- ☐ Salary bands computed → meaningful grade-level analysis
- ☐ Job architecture + employee mapping → meaningful job-level analysis
- ☐ Grade mappings → connected analysis (grades map to job levels)

These are informational indicators, not blockers — orgs can run analysis with partial setup, but results improve with more structure.

---

## Compliance Risk Register

| Risk | Severity | Regulation | Mitigation |
|------|----------|-----------|------------|
| No stable employee identity across datasets | **Critical** | EPTD Art. 9/10 | Workstream A: `employee_identities` table |
| No assignment audit trail | **Critical** | EPTD Art. 10, BetrVG §80 | Workstream A: `assignment_carryovers` + change log |
| Cross-tariff pay gap comparisons | **High** | EntgTranspG §4 | Workstream B: tariff-scoped analysis |
| No Stufen modeling → false gap flags | **High** | EPTD Art. 4 | Workstream B: `salary_band_steps` |
| AT employees mixed into tariff analysis | **Medium** | EntgTranspG §5(3) | Workstream B: AT isolation |
| Auto-mapping criteria not documented | **Medium** | EPTD Art. 4(4) | Document algorithm in Betriebsrat report export |
| No immutable report snapshots | **Medium** | EPTD Art. 9(9) | Assignment snapshot on report generation |

---

## Prioritized Action Plan

### Phase 1 — Carryover MVP (High impact, unblocks yearly workflow)
1. Migration: `employee_identities` table + `employees.identity_id`
2. Migration: `assignment_carryovers` table + expand `source` CHECK
3. Backfill: link existing employees to identities via `employee_ref`
4. Server action: `runCarryover(targetDatasetId, sourceDatasetId)`
5. UI: CarryoverReview component in HeadcountTab
6. Identity linking in import pipeline
7. i18n keys (de/en)

### Phase 2 — Module Clarity & Band Context (Quick wins, no schema changes)
8. Greenfield onboarding card in Job Architecture (guided sequence with i18n)
9. Cross-module hints: Salary Band → "Next: Job Architecture"; HeadcountTab → "Missing: grade mappings"
10. Empty-state guidance per tab (Leveling, Families, GradeMapping, Headcount, Competencies)
11. Bridge explanation note at top of GradeMappingTab
12. Add optional "Band" column to AutoMapReviewTable (uses existing ctx data)
13. Richer band context in JobModal when level is selected
14. Readiness indicators in module headers (informational, not blocking)

### Phase 3 — Tariff Foundation (Opt-in, non-breaking)
15. Migration: `tariff_structures` table (new table only)
16. Migration: nullable `tariff_id` columns on `salary_bands`, `employees`, `job_grade_mappings`
17. NO auto-migration of existing data — orgs opt in manually
18. Tariff filter in `matchEmployee()` auto-mapping (backward compatible)
19. Tariff grouping UI in SalaryBandModuleClient (only when tariffs exist)
20. Optional tariff filter dropdown in GradeMappingTab

### Phase 4 — Stufen & AT (German market depth)
21. Migration: `salary_band_steps` table + `employees.tariff_step`
22. Stufen entry UI (or TVöD table import)
23. AT handling: dedicated tariff type + separate analysis cohort
24. Pay gap engine: `tariff_id` and `tariff_step` as optional WIF factors

### Phase 5 — Polish & Compliance Hardening
25. Immutable assignment snapshots on report generation
26. Document auto-mapping criteria in exportable format
27. Viewer role RLS: restrict to aggregate data only
28. Carryover as optional step in import wizard
29. Year-over-year comparison view (side-by-side datasets)

---

## Key Files

| Area | File |
|------|------|
| Types | `src/lib/jobArchitecture/types.ts` |
| Context loader | `src/lib/jobArchitecture/getJobArchitectureContext.ts` |
| Auto-mapping | `src/app/(dashboard)/dashboard/job-architecture/autoMapAction.ts` |
| Mapping actions | `src/app/(dashboard)/dashboard/job-architecture/mappingActions.ts` |
| HeadcountTab | `src/components/dashboard/job-architecture/HeadcountTab.tsx` |
| AutoMapReview | `src/components/dashboard/job-architecture/AutoMapReview.tsx` |
| ReviewTable | `src/components/dashboard/job-architecture/AutoMapReviewTable.tsx` |
| GradeMappingTab | `src/components/dashboard/job-architecture/GradeMappingTab.tsx` |
| JobModal | `src/components/dashboard/job-architecture/JobModal.tsx` |
| Band context | `src/lib/band/getBandContext.ts` |
| Band helpers | `src/lib/band/bandHelpers.ts` |
| Band module UI | `src/app/(dashboard)/dashboard/salary-bands/SalaryBandModuleClient.tsx` |
| Band settings | `src/app/(dashboard)/dashboard/settings/SalaryBandsPanel.tsx` |
| Band visualization | `src/components/dashboard/BandVisualizationChart.tsx` |
| Compliance heatmap | `src/components/dashboard/ComplianceHeatmap.tsx` |
| Pay gap engine | `src/lib/calculations/payGap.ts` |
| Migrations | `database/migrations/` (022, 023, 027, 030) |
