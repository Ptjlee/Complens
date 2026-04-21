# Job Architecture Module — CompLens

## Overview

The Job Architecture module enables organisations to define, manage, and evaluate their job leveling framework — the backbone of pay equity analysis under EU Directive 2023/970. It provides a structured approach to job evaluation that satisfies the Directive's requirement for "objective, gender-neutral criteria" (Art. 4) when comparing work of equal value.

CompLens replaces the traditional consultant-driven job evaluation process (typically €15,000–25,000 per cycle) with an integrated, AI-assisted framework that connects directly to pay gap analysis and compliance reporting.

---

## Module Features

### 1. Leveling Structure (Einstufungen)

Define your organisation's job levels (e.g., L1–L10). Each level includes:

- **Level Code** — unique identifier (L1, L2, ... L10)
- **Title Examples** — representative job titles at this level (e.g., "Senior Professional", "Director")
- **Summary Description** — one-line overview of the level
- **Dimensional Descriptors** — detailed evaluation criteria across 6 dimensions (see Multi-Dimensional Framework below)

**Three ways to create a structure:**

| Method | Best for | How it works |
|--------|----------|-------------|
| **CompLens Standard (L1–L10)** | Most organisations | Pre-populated 10-level framework based on industry best practices. Customise to fit your organisation. |
| **CompLens Assistant** | Tailored structures | Describe your organisation (size, industry, complexity) and the AI generates a custom leveling structure. |
| **Manual** | Full control | Define each level from scratch. |

### 2. Job Families & Jobs (Familien & Stellen)

Organise roles into job families (e.g., Engineering, Sales, HR) and individual jobs within each family. Each job includes:

- **Job title and description**
- **Key responsibilities**
- **Required qualifications**
- **Assigned level** (mapped to the leveling structure)
- **Job family assignment**

### 3. Competencies (Kompetenzen)

Define competency frameworks that describe expected behaviours at each level:

- **Core competencies** — apply to all roles (e.g., Communication, Problem Solving)
- **Leadership competencies** — for people management roles
- **Technical competencies** — domain-specific skills
- **Functional competencies** — role-specific capabilities

Each competency includes behavioural descriptors per level, enabling objective assessment.

### 4. Grade Mapping (Zuordnung)

Map your internal job levels to pay grades (Entgeltgruppen) from your salary band structures. CompLens supports **many-to-many mapping** — a single level can be mapped to multiple pay grades, reflecting real-world pay structures.

**How it works:**
- Each level row shows its currently assigned pay grades as **chips** (e.g., `[E10] [E11]`)
- Click the **+ Add grade** dropdown to assign additional grades to a level
- Click **×** on a chip to remove a mapping
- Multiple salary band structures are supported side by side

**Why many-to-many?**
Companies using TVöD, ERA, or custom frameworks often have overlapping grade assignments:
- L3 (Professional) → E8, E9a, E9b
- L6 (Manager) → E11, E12
- L8 (Director) → E13, E14, E15

A one-to-one mapping would force artificial simplification. Many-to-many reflects how organisations actually structure pay.

**Entgeltgruppen from data import:**
When users upload salary data via the Import Wizard, the `job_grade` column (Entgeltgruppe / Level) is mapped automatically by the AI column mapper. The distinct pay grades from the imported data become available in the salary bands module and in the grade mapping dropdown. No manual data entry required — CompLens reads the grades directly from your HR export.

### 5. JD Upload & Auto-Evaluation

Upload job descriptions (PDF or DOCX) and CompLens automatically:

- **Extracts** job title, responsibilities, and qualifications from the document
- **Evaluates** the role against all defined levels using the dimensional descriptors
- **Suggests** the appropriate level with a confidence score and reasoning
- **Creates** a draft job record ready for review

**How the AI evaluation engine works:**

1. The uploaded JD is parsed (PDF via `pdf-parse`, DOCX via `mammoth`)
2. All level definitions — including dimensional descriptors — are formatted as context
3. Google Gemini (`gemini-2.5-flash`) evaluates the JD against each level
4. The AI returns: suggested level, confidence score (0–100%), reasoning, extracted title, responsibilities, and qualifications
5. The HR admin reviews, adjusts if needed, and confirms

**Data privacy:** Only the JD text and level definitions are sent to the AI. No employee names, salaries, or personal data are transmitted. The AI processes through EU-based API endpoints.

### 6. Settings (Einstellungen)

- Overview dashboard showing counts: levels, families, jobs, competencies
- Manage multiple leveling structures (one active/default at a time)
- Danger zone: delete structures with confirmation

---

## Multi-Dimensional Level Framework

### Strategic Plan

A robust job leveling framework — the kind used by Korn Ferry, Mercer IPE, Willis Towers Watson, or Radford — evaluates roles across multiple dimensions rather than a single description line. CompLens implements a 6-dimension model that maps directly to the EU Pay Transparency Directive's requirements.

### The 6 Dimensions

| # | Dimension | What it measures | EU Directive mapping |
|---|-----------|------------------|---------------------|
| 1 | **Problem Solving** | Complexity of problems handled, analytical depth, creativity required | Art. 4: Effort |
| 2 | **Accountability & Impact** | Scope of responsibility, consequences of decisions, financial impact | Art. 4: Responsibility |
| 3 | **People Leadership** | Managing, coaching, developing others; team size and complexity | Art. 4: Responsibility |
| 4 | **Knowledge & Expertise** | Depth and breadth of domain knowledge, qualifications, experience | Art. 4: Skills |
| 5 | **Communication & Influence** | Stakeholder interactions, presentation level, influence scope | Art. 4: Skills + Effort |
| 6 | **Autonomy & Decision Rights** | Independence level, decision-making authority, strategic vs. operational | Art. 4: Effort |

### EU Directive Alignment (Art. 4)

The Directive requires that pay be based on "objective, gender-neutral criteria" assessing:

| Directive Factor (Art. 4) | CompLens Dimensions |
|---------------------------|---------------------|
| **Skills** | Knowledge & Expertise, Communication & Influence |
| **Effort** | Problem Solving, Autonomy & Decision Rights |
| **Responsibility** | Accountability & Impact, People Leadership |
| **Working conditions** | Captured at the individual job level (location, shift, hazards) |

This 6-dimension model ensures that CompLens's job evaluation methodology is demonstrably gender-neutral and objective — a key requirement for Art. 4(4) of Directive 2023/970.

### Why 6 Dimensions (not just a description)?

Single-line descriptions fail in three critical ways:

1. **They can't differentiate adjacent levels.** What separates a Senior Professional (L4) from a Lead (L5)? A one-liner can't capture the nuance. Dimensions like "Autonomy" and "People Leadership" make the distinction concrete.

2. **They don't satisfy regulators.** Art. 4 of the Directive requires employers to demonstrate that their job classification uses "objective criteria." A one-sentence description is not defensible in a Joint Pay Assessment. A multi-dimensional matrix is.

3. **They can't power AI evaluation.** The JD upload engine evaluates uploaded job descriptions against level definitions. More dimensional detail = more accurate level suggestions. With 6 dimensions, the AI has enough context to distinguish between, for example, a senior IC role (high Knowledge, low People Leadership) and a first-time manager (moderate Knowledge, emerging People Leadership).

### Example: L1–L10 Dimensional Matrix

#### L1 — Support / Intern

| Dimension | Descriptor |
|-----------|-----------|
| Problem Solving | Solves routine, well-defined problems using documented procedures and close guidance |
| Accountability & Impact | Accountable for completing assigned tasks accurately and on time. Errors are caught by supervision |
| People Leadership | No direct reports. Receives mentoring from more senior colleagues |
| Knowledge & Expertise | Foundational knowledge; actively learning core concepts and tools of the domain |
| Communication & Influence | Communicates within immediate team. Asks questions, reports progress |
| Autonomy & Decision Rights | Works under close supervision with detailed instructions. Escalates all non-routine decisions |

#### L3 — Professional

| Dimension | Descriptor |
|-----------|-----------|
| Problem Solving | Solves moderately complex problems within established frameworks. Identifies issues and proposes solutions |
| Accountability & Impact | Accountable for own work output and quality. Contributes to team-level deliverables |
| People Leadership | No direct reports. May informally guide junior colleagues or interns |
| Knowledge & Expertise | Solid working knowledge of core domain. Applies standard practices confidently |
| Communication & Influence | Communicates across team and with adjacent stakeholders. Presents work to peers and manager |
| Autonomy & Decision Rights | Works independently on defined tasks. Exercises judgement within guidelines; escalates exceptions |

#### L5 — Lead / Staff

| Dimension | Descriptor |
|-----------|-----------|
| Problem Solving | Tackles complex, cross-functional problems. Develops new approaches when existing methods fall short |
| Accountability & Impact | Accountable for workstream or project outcomes. Decisions affect team productivity and quality |
| People Leadership | May lead a small team (2–5) or act as technical lead without formal reports. Mentors and coaches |
| Knowledge & Expertise | Deep expertise in core domain with solid understanding of adjacent areas. Recognised internally |
| Communication & Influence | Communicates across functions and with senior stakeholders. Influences technical and process decisions |
| Autonomy & Decision Rights | Drives own agenda within strategic direction. Makes independent decisions on approach and methodology |

#### L8 — Director

| Dimension | Descriptor |
|-----------|-----------|
| Problem Solving | Addresses ambiguous, multi-stakeholder problems with significant financial and organisational impact |
| Accountability & Impact | Accountable for department-level P&L, strategic outcomes, and talent development pipeline |
| People Leadership | Leads 30–80+ staff across multiple teams. Hires, develops, and promotes managers |
| Knowledge & Expertise | Expert across multiple domains. External thought leader. Shapes industry practices |
| Communication & Influence | Presents to C-suite and board. Represents the organisation externally. Shapes company positioning |
| Autonomy & Decision Rights | Sets department direction autonomously. Makes binding commitments for the organisation |

#### L10 — C-Level / SVP

| Dimension | Descriptor |
|-----------|-----------|
| Problem Solving | Defines which problems the organisation should solve. Navigates geopolitical, market, and regulatory complexity |
| Accountability & Impact | Accountable for enterprise-level outcomes: revenue, market position, compliance, culture |
| People Leadership | Leads entire functions or business units (100–1000+ staff). Shapes organisational design |
| Knowledge & Expertise | Visionary expertise. Sets the standard for the industry. Advises boards and regulators |
| Communication & Influence | Board-level communication. Media, investor, and regulator-facing. Defines company narrative |
| Autonomy & Decision Rights | Full executive authority within mandate. Reports to board/CEO. Makes irreversible strategic bets |

### Implementation Phases

#### Phase 1: Schema & UI (Current Sprint)

**Database changes:**
- Add 3 new columns to `level_definitions`: `knowledge_expertise`, `communication_influence`, `autonomy_decision_rights`
- Add same columns to `default_level_definitions` (template table)
- Backfill the L1–L10 template with professional-grade dimensional descriptions in both DE and EN

**UI changes:**
- **Table view** keeps the compact format: Level Code | Title | Summary
- **Row expand** (click a row): accordion expands to show all 6 dimensions read-only
- **Edit modal** (click ✏️): full drawer with two tabs — Overview (code, title, summary) and Dimensions (6 text areas with helper tooltips)
- **Pre-populated** from template when using L1–L10 standard
- **Editable** by admin — each org can customise their level definitions

#### Phase 2: AI Enhancement

- "New structure with assistant" generates all 6 dimensions per level based on org context
- JD upload evaluation uses all 6 dimensions for more accurate level matching
- Per-dimension confidence scores in JD evaluation results

#### Phase 3: Bilingual Content

- Default L1–L10 template descriptions in both DE and EN
- Dimension labels and helpers via translation system
- Content (user-authored descriptions) stored as entered

---

## Technical Architecture

### Key Database Tables

```
level_definitions
├── id                       UUID PK
├── org_id                   UUID FK → organisations
├── structure_id             UUID FK → leveling_structures
├── level_code               TEXT (L1, L2, ... L10)
├── sort_order               INT
├── title_examples           TEXT
├── description              TEXT (one-line summary)
├── problem_solving          TEXT (dimension 1)
├── accountability           TEXT (dimension 2)
├── people_management        TEXT (dimension 3)
├── knowledge_expertise      TEXT (dimension 4)
├── communication_influence  TEXT (dimension 5)
├── autonomy_decision_rights TEXT (dimension 6)
└── created_at / updated_at  TIMESTAMPTZ

job_grade_mappings (many-to-many: level ↔ pay grades)
├── id                       UUID PK
├── org_id                   UUID FK → organisations
├── level_id                 UUID FK → level_definitions
├── salary_band_id           UUID FK → salary_band_structures
├── mapped_grade             TEXT (e.g., "E10", "Band 8")
├── mapped_grade_id          UUID FK → salary_band_grades (optional)
├── UNIQUE(org_id, level_id, salary_band_id, mapped_grade)
└── created_at / updated_at  TIMESTAMPTZ
```

**Note:** The `job_grade_mappings` table uses a composite unique constraint on `(org_id, level_id, salary_band_id, mapped_grade)` — not on `(org_id, level_id, salary_band_id)`. This allows multiple pay grades per level while preventing duplicates.

### Data Flow

```
Job Description (PDF/DOCX)
    ↓
Text Extraction (pdf-parse / mammoth)
    ↓
Level Definitions + Dimensions (from DB)
    ↓
AI Evaluation Prompt (Gemini 2.5 Flash)
    ↓
Suggested Level + Confidence + Reasoning
    ↓
HR Admin Review → Confirm → Job Record Created
    ↓
Linked to Pay Analysis (Grade Mapping → Salary Bands → Art. 9 Report)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/dashboard/job-architecture/page.tsx` | Server component: auth, access check, data fetch |
| `src/app/(dashboard)/dashboard/job-architecture/JobArchitectureClient.tsx` | Client component: tab routing |
| `src/components/dashboard/job-architecture/LevelingTab.tsx` | Leveling structure CRUD |
| `src/components/dashboard/job-architecture/FamiliesTab.tsx` | Job families & jobs |
| `src/components/dashboard/job-architecture/CompetencyTab.tsx` | Competency framework |
| `src/components/dashboard/job-architecture/GradeMappingTab.tsx` | Level ↔ pay band mapping |
| `src/components/dashboard/job-architecture/JdUploadTab.tsx` | JD upload & AI evaluation |
| `src/components/dashboard/job-architecture/SettingsTab.tsx` | Module settings |
| `src/app/(dashboard)/dashboard/job-architecture/aiHelpers.ts` | AI model config, JSON parsing |
| `src/app/(dashboard)/dashboard/job-architecture/aiActions.ts` | AI-powered actions (JD generation, competency generation) |
| `src/app/(dashboard)/dashboard/job-architecture/jdUploadAction.ts` | JD upload & evaluation server action |
| `src/app/(dashboard)/dashboard/job-architecture/actions.ts` | CRUD server actions for structures & levels |
| `src/lib/jobArchitecture/types.ts` | TypeScript type definitions |
| `src/lib/jobArchitecture/getJobArchitectureContext.ts` | Access control & context loading |

### Access Control

- **Admin** role: full access (CRUD all entities)
- **Analyst** role: full access
- **Viewer** role: no access (hidden from sidebar, page redirects to dashboard)
- **Plan check**: requires `licensed`, `paylens`, `paylens_ai` plan OR active trial OR `job_architecture_enabled` flag

---

## Glossary

| Term | Definition |
|------|-----------|
| **Leveling structure** | The complete set of job levels (e.g., L1–L10) used by an organisation |
| **Level definition** | A single level with its code, title, description, and dimensional descriptors |
| **Job family** | A group of related jobs (e.g., "Engineering", "Sales", "Finance") |
| **Job** | A specific role within a job family, assigned to a level |
| **Competency** | A measurable skill or behaviour expected at each level |
| **Grade mapping** | The link between a job level and a pay band/salary structure |
| **JD evaluation** | AI-powered analysis of a job description to suggest the appropriate level |
| **WIF** | Wage Influencing Factors — the characteristics used to adjust the pay gap (Art. 9) |
| **Compa-ratio** | Salary ÷ band midpoint × 100 — measures pay competitiveness |
| **Joint Pay Assessment** | Mandatory review triggered when the adjusted pay gap exceeds 5% (Art. 9) |
