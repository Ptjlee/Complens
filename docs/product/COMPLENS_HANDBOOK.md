# CompLens Product Handbook

**For HR Professionals, Compensation Analysts, and Compliance Officers**

Version 1.0 — April 2026

---

## Table of Contents

1. [Introduction](#part-1-introduction)
2. [Getting Started](#part-2-getting-started)
3. [Data Import](#part-3-data-import)
4. [Pay Gap Analysis](#part-4-pay-gap-analysis)
5. [Salary Bands (EU Art. 9 Compliance)](#part-5-salary-bands)
6. [Job Architecture](#part-6-job-architecture)
7. [Explanations & Justifications (Art. 10)](#part-7-explanations--justifications)
8. [Remediation Planning (Art. 11)](#part-8-remediation-planning)
9. [Reports & Exports](#part-9-reports--exports)
10. [Employee Information Rights (Art. 7)](#part-10-employee-information-rights)
11. [Trend Analysis](#part-11-trend-analysis)
12. [Settings & Administration](#part-12-settings--administration)
13. [Quick Reference](#part-13-quick-reference)

---

# Part 1: Introduction

## What Is CompLens?

CompLens is a pay transparency compliance platform built for the European market. It takes your existing payroll data and transforms it into a complete EU Pay Transparency Directive compliance package — including pay gap analysis, salary band evaluation, job architecture, mandatory reporting, and employee information rights.

Where traditional HR consultants charge between EUR 15,000 and EUR 25,000 per analysis cycle and deliver results weeks later, CompLens delivers the same output in minutes. The platform is designed for HR professionals who need to comply with the EU Directive without becoming pay equity statisticians.

CompLens is built and hosted in Germany, with all data processing on EU servers (Frankfurt). It is fully GDPR-compliant with a signed Auftragsverarbeitungsvertrag (AVV) available directly in the platform.

## Who Is CompLens For?

| Role | How CompLens helps |
|------|-------------------|
| **HR Director / Head of HR** | Full compliance overview, board-ready reports, deadline management |
| **Compensation & Benefits Manager** | Detailed pay gap analysis, salary band design, market benchmarking |
| **Compliance Officer** | Art. 9 mandatory reporting, Art. 7 employee information rights, audit trail |
| **Works Council (Betriebsrat)** | Read-only access to analysis results, independent verification rights (BetrVG Paragraph 80) |
| **CFO / Finance** | Budget simulation for remediation, cost-of-compliance forecasting |

CompLens is designed for organisations with **100 to 500 employees** — the segment most affected by the EU Directive's reporting requirements and least likely to have in-house compensation analytics teams.

## The EU Pay Transparency Directive 2023/970

The EU Pay Transparency Directive (Directive 2023/970 of 10 May 2023) establishes binding rules to strengthen the principle of equal pay for equal work or work of equal value. Member States must transpose it into national law by **7 June 2026**.

### Key Articles

| Article | Requirement | CompLens Module |
|---------|-------------|-----------------|
| **Art. 4** | Pay must be based on objective, gender-neutral criteria: skills, effort, responsibility, working conditions | Job Architecture (6-dimension leveling framework) |
| **Art. 7** | Workers have the right to request information about their individual pay level and the average pay levels by gender for workers doing equal work | Employee Portal |
| **Art. 9** | Employers must report gender pay gap data to the monitoring body; if the gap exceeds 5% and cannot be justified, a joint pay assessment is required | Pay Gap Analysis, Salary Bands, Reports |
| **Art. 10** | Employers must provide objective justifications when gaps exist; unjustified gaps trigger remediation obligations | Explanations Module |
| **Art. 11** | Where a joint pay assessment reveals unjustified gaps, employers must take measures to remedy the situation | Remediation Planner |

### Reporting Timeline

| Company size | First report due | Reporting frequency |
|-------------|-----------------|---------------------|
| 250+ employees | 7 June 2027 | Annually |
| 150–249 employees | 7 June 2027 | Every 3 years |
| 100–149 employees | 7 June 2031 | Every 3 years |

### The 5% Threshold

Art. 9(1)(c) establishes the critical threshold: if the gender pay gap in any category of workers exceeds **5%** and the employer cannot justify the difference with objective, gender-neutral factors, a **joint pay assessment** with worker representatives is required. This assessment must identify the causes, develop remediation measures, and track progress.

CompLens flags every grade, department, and cohort that crosses this threshold and guides you through the mandatory response workflow.

## How CompLens Replaces the Consultant Approach

| Aspect | Traditional consultant | CompLens |
|--------|----------------------|----------|
| Cost per cycle | EUR 15,000–25,000 | Annual licence (fraction of the cost) |
| Time to results | 4–8 weeks | Minutes after data upload |
| Repeatability | Re-engagement required each year | Run analyses as often as needed |
| Year-over-year tracking | Manual comparison | Built-in trend analysis |
| Employee portal (Art. 7) | Not included | Self-service, always available |
| Audit trail | Paper-based or absent | Complete digital record |
| Job evaluation | Manual, subjective | AI-assisted, 6-dimension framework |
| Updates | Re-engagement fee | Included in licence |

---

# Part 2: Getting Started

## Registration and Trial

1. Visit **complens.de** and click the registration button
2. Enter your work email address and choose a password
3. Confirm your email address via the link sent to your inbox
4. You now have **7 days of full access** — every feature, including AI analysis and report generation

During the trial period, all exports (PDF reports and PowerPoint presentations) are marked with a **MUSTER** (sample) watermark. Content is visible but clearly identified as trial output. After purchasing a licence, the watermark disappears and all exports are production-ready.

**Trial limits:**
- Maximum 10 employees per dataset (to demonstrate functionality without requiring real payroll data)
- Full AI access (column mapping, chatbot, job evaluation)
- All modules accessible

## Setting Up Your Organisation

After your first login, CompLens guides you through an onboarding flow:

1. **Organisation name** — your company's legal name
2. **Country** — determines regulatory context and default language
3. **Legal representative** — name and title of the Geschaeftsfuehrer or authorised signatory (used in contracts and reports)
4. **Address details** — Firmensitz, PLZ, city (required for AVV and licence contract generation)
5. **VAT ID** — Umsatzsteuer-ID for invoicing

These details can be updated later under Settings > Organisation.

## Inviting Team Members

CompLens supports collaborative work with role-based access:

| Role | Permissions |
|------|------------|
| **Admin** | Full access: upload data, run analyses, manage explanations, create reports, manage settings, invite members |
| **Viewer** | Read-only access to analysis results and reports. Cannot see individual employee data. Cannot modify anything. Ideal for works council members or executives who need oversight without configuration rights. |

**To invite a team member:**
1. Go to Settings > Team
2. Enter their email address and select a role
3. They receive an invitation email with a link to join
4. On joining, they set their name and function (e.g., "Betriebsratsvorsitzende")

Your licence includes 1 Admin seat and 1 Viewer seat. Additional seats can be purchased.

## Language Settings

CompLens supports German and English throughout the entire interface, including:
- Navigation and labels
- Analysis results and explanations
- Report text and legal language
- Error messages and guidance

Each user sets their preferred language independently. The setting is saved to your profile and persists across sessions. Switch at any time via Settings > Language.

---

# Part 3: Data Import

## Preparing Your Payroll Data

CompLens accepts CSV and Excel files exported from any HR or payroll system — SAP HCM, DATEV, Personio, Workday, or a simple Excel spreadsheet. There is no required format: CompLens adapts to your column structure.

## Required vs. Optional Fields

| Field | Required | Purpose |
|-------|----------|---------|
| **Employee ID** (Personalnummer) | Recommended | Unique identifier for year-over-year tracking |
| **Gender** (Geschlecht) | Yes | Basis of gender pay gap calculation |
| **Base salary** (Grundgehalt) | Yes | Primary compensation figure |
| **Department** (Abteilung) | Recommended | Department-level gap breakdown |
| **Job grade** (Entgeltgruppe / Level) | Recommended | Grade-level analysis and salary band computation |
| **Job title** (Stellenbezeichnung) | Recommended | Used for job architecture mapping |
| **Weekly working hours** (Wochenstunden) | Recommended | Part-time normalisation |
| **Variable pay** (variable Verguetung) | Optional | Bonus, commission, overtime — included in total compensation analysis |
| **Benefits in kind** (Sachbezuege) | Optional | Non-cash benefits |
| **Date of birth / Age** | Optional | WIF (Wage Influencing Factor) for adjusted gap |
| **Tenure / Start date** | Optional | WIF for adjusted gap |
| **Education level** | Optional | WIF for adjusted gap |
| **Location** | Optional | WIF for regional cost-of-living adjustment |

**Minimum requirement:** CompLens needs at least gender and base salary to run a basic analysis. The more fields you provide, the more precise and defensible your analysis becomes.

## AI-Powered Column Mapping

When you upload a file, CompLens reads your column headers and uses AI to map them to the correct fields automatically. This works regardless of language, abbreviation, or naming convention:

- `Bruttojahresgehalt` maps to Base Salary
- `Abt.` maps to Department
- `EG` or `Entgeltgruppe` maps to Job Grade
- `VZAe` or `FTE` maps to Working Hours

After the AI mapping, you see a review screen showing every column and its proposed mapping. You can accept, change, or skip any column before proceeding.

**Manual mapping** is always available as a fallback if you prefer to map columns yourself.

## Handling Part-Time, Variable Pay, and Minijobs

**Part-time employees:** If weekly working hours are provided, CompLens automatically normalises salaries to full-time equivalent (FTE). A part-time employee earning EUR 30,000 at 20 hours/week is normalised to EUR 60,000 FTE for comparison purposes. This ensures part-time workers (disproportionately women) are not incorrectly flagged as underpaid.

**Variable pay:** When variable compensation fields are present, CompLens calculates both:
- **Base pay gap** — using only fixed salary
- **Total compensation gap** — including variable pay, bonuses, and benefits

Both figures appear in the analysis and can be toggled in the salary band visualisation.

**Minijobs (geringfuegig Beschaeftigte):** Employees with very low working hours or salaries below the Minijob threshold can be included or excluded from the analysis depending on your reporting needs. The EU Directive covers all workers, but your analysis may warrant separate treatment of marginal employment.

## Dataset Management

Each upload creates a **dataset** — a snapshot of your workforce at a point in time. You can:

- **Name** datasets meaningfully (e.g., "Q4 2025 Payroll", "January 2026 Full Export")
- **Archive** datasets you no longer need for active analysis (recoverable)
- **Delete** datasets permanently (irreversible, with confirmation)
- **Switch** between datasets to compare different time periods

The dataset name appears on all reports and exports, so choose something recognisable for your records.

---

# Part 4: Pay Gap Analysis

## The Three-Tier Gap Calculation

CompLens calculates the gender pay gap in three progressive tiers, aligning with the EU Directive's requirements:

### Tier 1: Unadjusted Gap (Raw)

The straightforward comparison: median and mean salary of all women vs. all men in the organisation or group, with no adjustments. This is the figure most commonly cited in public reporting and the starting point for Art. 9 compliance.

**Formula:** (Median male salary - Median female salary) / Median male salary x 100

A positive percentage means men earn more; a negative percentage means women earn more.

### Tier 2: Adjusted Gap (WIF-Adjusted / Structurally Adjusted)

The adjusted gap accounts for **Wage Influencing Factors (WIF)** — objective characteristics that legitimately explain pay differences:

| WIF category | Examples |
|-------------|----------|
| Job grade / level | Entgeltgruppe, career level |
| Department / function | Engineering vs. administration |
| Tenure / seniority | Years of service |
| Working hours | Full-time vs. part-time |
| Education | Degree level, professional qualifications |
| Location | Regional cost-of-living differences |
| Age / experience | Proxy for accumulated expertise |

The adjusted gap shows: **after accounting for structural differences, how much of the pay gap remains?** This is the figure that determines whether you cross the 5% threshold that triggers a joint pay assessment under Art. 9.

### Tier 3: Residual Gap (After Explanations)

After you have provided individual explanations for flagged employees (see Part 7), CompLens recalculates the gap excluding the justified portion. The residual gap represents the truly unexplained difference — the figure that requires remediation under Art. 11.

## Understanding the 5% Threshold (Art. 9)

The EU Directive establishes a clear trigger: if the adjusted pay gap in any **category of workers** exceeds 5% and cannot be justified by objective, gender-neutral factors, the employer must:

1. Conduct a **joint pay assessment** with worker representatives
2. Identify the **causes** of the gap
3. Develop **remediation measures** (see Part 8)
4. **Track progress** and report on implementation

CompLens highlights every group that crosses the 5% threshold with a clear visual indicator, making it immediately obvious where action is required.

## Reading Your Results

Analysis results are broken down across multiple dimensions:

**By department:** See the gap for each organisational unit — useful for identifying where structural issues concentrate.

**By pay grade:** The most compliance-relevant view. Art. 9 requires reporting at the level of "categories of workers doing the same work or work of equal value." Pay grades are the most common way to define these categories.

**By quartile:** The workforce split into four equal groups by salary. Art. 9(1)(a) explicitly requires reporting the proportion of female and male workers in each quartile pay band. CompLens calculates this automatically.

**Individual flags:** Every employee whose pay deviates more than 5% from the gender-specific median in their cohort is flagged for review. This is not a public reporting requirement but an essential tool for identifying where individual explanations or corrections are needed.

## The AI Chatbot

A floating AI assistant is available on every page in CompLens. You can ask questions about your analysis in natural language:

- "Why is the gap in the Finance department so high?"
- "Which grades are above the 5% threshold?"
- "How many women are in the top quartile?"
- "What does Art. 9 require me to report?"

The chatbot understands your organisation's data context and the EU Directive. It draws on your uploaded datasets, analysis results, and the directive text to provide specific, actionable answers. No employee data leaves the EU during these interactions.

---

# Part 5: Salary Bands (EU Art. 9 Compliance)

## What Are Salary Bands and Why They Matter

Salary bands (Entgeltbaender) define the expected pay range for each grade or level in your organisation. Under the EU Directive, Art. 9 requires employers to report on pay levels broken down by categories of workers. Salary bands provide the structural framework for this reporting.

Beyond compliance, salary bands serve as a governance tool: they make pay decisions transparent, reduce the risk of unconscious bias, and provide a clear reference point for managers making compensation decisions.

## Auto-Detection of Grade Naming Schemes

When you upload payroll data containing a job grade column, CompLens automatically detects the naming convention used:

| Detected scheme | Examples | Common in |
|----------------|----------|-----------|
| G-scale | G1, G2, ... G10 | Corporate / international firms |
| L-scale | L1, L2, ... L8 | Tech companies |
| TVoeD | E1, E2, ... E15 | Public sector (Oeffentlicher Dienst) |
| TV-L | E1, E2, ... E15 | Laender public sector |
| ERA | ERA 1, ERA 2, ... ERA 17 | Manufacturing (Metall- und Elektroindustrie) |
| Band scheme | Band A, Band B, ... Band F | Finance / consulting |
| Custom | Any consistent pattern | Haustarif, individual agreements |

This detection happens automatically — you do not need to specify your scheme.

## One-Click Band Generation

After uploading your data, go to the Salary Bands module and click **"Baender erkennen"** (Detect Bands). CompLens will:

1. Read all distinct grades from your employee data
2. Create a salary band structure with one grade entry per detected grade
3. Compute internal statistics immediately from your actual employee salaries

No manual data entry required. Your salary bands are populated with real data in seconds.

## Internal Statistics: What Each Metric Means

For each grade, CompLens computes the following from your employee data:

| Metric | What it shows |
|--------|--------------|
| **Minimum** | Lowest salary in this grade |
| **P25 (25th percentile)** | 25% of employees earn less than this figure |
| **Median (P50)** | The middle salary — half earn more, half earn less |
| **P75 (75th percentile)** | 75% of employees earn less than this figure |
| **Maximum** | Highest salary in this grade |
| **Female median** | Median salary of women in this grade |
| **Male median** | Median salary of men in this grade |
| **Headcount (n)** | Number of employees in this grade |
| **Female / male count** | Gender breakdown per grade |

These statistics update automatically when you switch to a different dataset.

## Intra-Grade Gender Gap and the 5% Threshold

For each grade, CompLens calculates the **intra-grade gender pay gap**: the difference between the male and female median salary within that specific grade. This is the most compliance-relevant metric under Art. 9, because it answers the question: "Among people doing the same work (same grade), is there a gender pay difference?"

Grades where the intra-grade gap exceeds 5% are flagged as **non-compliant**. The compliance heatmap (see below) makes this immediately visible.

## Compa-Ratio: Measuring Pay Competitiveness

The **compa-ratio** shows how your actual pay compares to the target:

**Formula:** Internal median / Band midpoint x 100

| Compa-ratio | Interpretation |
|-------------|---------------|
| Below 90% | Significantly below target — risk of attrition |
| 90%–97% | Below target — monitor |
| 97%–103% | On target |
| 103%–110% | Above target — monitor |
| Above 110% | Significantly above target — review justification |

If you have added external market benchmarks (see next section), CompLens also calculates the compa-ratio against market data: Internal median / Market P50 x 100.

## Adding External Market Benchmarks

Salary bands are most powerful when you can compare your internal pay to the external market. CompLens allows you to enter market benchmark data per grade from any source:

- **Kienbaum** — leading German compensation survey
- **Radford** (Aon) — technology sector benchmarks
- **StepStone** — broad market salary data
- **Mercer** — global compensation surveys
- **Custom source** — any compensation study or industry survey

For each grade and benchmark source, enter:
- **P25** — market 25th percentile
- **P50** — market median
- **P75** — market 75th percentile

Once entered, market data appears as an overlay on the salary band visualisation, allowing you to see at a glance where your grades sit relative to the market.

## The Compliance Heatmap

The compliance heatmap is a summary table showing every grade with its key metrics and a binary compliance status:

| Grade | Headcount | Female median | Male median | Intra-grade gap | Status |
|-------|-----------|--------------|-------------|-----------------|--------|
| E9a | 42 | EUR 48,200 | EUR 49,100 | 1.8% | Compliant |
| E10 | 31 | EUR 52,400 | EUR 56,800 | 7.7% | Non-compliant |
| E11 | 28 | EUR 59,100 | EUR 60,200 | 1.8% | Compliant |
| E12 | 19 | EUR 63,700 | EUR 68,500 | 7.0% | Non-compliant |

Grades below the 5% threshold are marked green. Grades at or above are marked red. This table maps directly to your Art. 9 reporting obligations — every red grade requires investigation and potentially a joint pay assessment.

The dashboard also shows a summary KPI: **"EU-compliant grades: X of Y"** — giving you an at-a-glance compliance score.

## Visualisation: Reading the Box Plots

The salary band chart uses horizontal box plots to visualise pay distribution per grade:

- The **box** spans from P25 to P75 (the interquartile range — where the middle 50% of salaries fall)
- The **line inside the box** marks the median
- **Separate markers** for the female median and male median make the gender gap visible at a glance
- **Whiskers** extend to the minimum and maximum
- If market benchmarks are added, a **shaded band** shows the market P25–P75 range behind the internal box

You can toggle between **base pay** and **total compensation** views. The total compensation view includes variable pay and benefits, giving a complete picture of the reward package.

---

# Part 6: Job Architecture

This is the flagship module. Job Architecture enables organisations to define, manage, and evaluate their job leveling framework — the backbone of pay equity analysis under the EU Directive. It provides a structured approach to job evaluation that satisfies the Directive's requirement for "objective, gender-neutral criteria" (Art. 4) when comparing work of equal value.

## How the Modules Connect

The following diagram shows how Salary Bands, Job Architecture, and employee data relate to each other:

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

**Salary Bands** answer: *"What do we currently pay?"* — computed from your payroll data.

**Job Architecture** answers: *"How is work organised?"* — your leveling framework, job catalogue, and competency model.

**Grade Mapping** is the bridge: it connects a job level (e.g., L4 Professional) to a salary grade (e.g., E11), linking organisational design to compensation reality.

**Employee Mapping** completes the picture: each employee is assigned to a job in the architecture, enabling analysis by job level rather than just by pay grade.

## 6.1 The Recommended Setup Sequence

For organisations building their job architecture from scratch, CompLens recommends this sequence:

| Step | Module / Tab | What you do | Why it matters |
|------|-------------|-------------|----------------|
| 1 | **Data Import** | Upload your payroll data | Creates employee records with grades, titles, salaries |
| 2 | **Salary Bands** | Click "Detect Bands" | Gives you immediate insight into what you actually pay |
| 3 | **Leveling** | Create or customise L1–L10 structure | Defines responsibility levels for your organisation |
| 4 | **Job Families & Positions** | Build your job catalogue | Organises roles into families and assigns levels |
| 5 | **Grade Mapping** | Connect levels to salary grades | Links your organisational design to your pay structure |
| 6 | **Headcount** | Map employees to jobs | Assigns real people to positions in the architecture |
| 7 | **Pay Gap Analysis** | Run analysis with job-level context | Meaningful because employees are now properly categorised |

You do not have to follow this exact order — CompLens works with partial setups — but this sequence produces the most complete and defensible compliance package.

## 6.2 Leveling Structure — The 6-Dimensional Framework

### Why Leveling Matters for Compliance

Art. 4 of the EU Directive requires that pay structures be based on "objective, gender-neutral criteria" encompassing **skills, effort, responsibility, and working conditions.** A single job title or a one-line description cannot demonstrate this objectivity. CompLens uses a 6-dimensional evaluation model that maps directly to the Directive's requirements and is consistent with the methodologies used by leading firms (Korn Ferry, Mercer IPE, Willis Towers Watson).

### The 6 Dimensions

| Dimension | What it measures | EU Directive mapping (Art. 4) |
|-----------|------------------|------------------------------|
| **Problem Solving** | Complexity of problems handled, analytical depth, creativity required | Effort |
| **Accountability & Impact** | Scope of responsibility, consequences of decisions, financial impact | Responsibility |
| **People Leadership** | Managing, coaching, developing others; team size and complexity | Responsibility |
| **Knowledge & Expertise** | Depth and breadth of domain knowledge, qualifications, experience | Skills |
| **Communication & Influence** | Stakeholder interactions, presentation level, influence scope | Skills + Effort |
| **Autonomy & Decision Rights** | Independence level, decision-making authority, strategic vs. operational focus | Effort |

### Creating Your Structure

CompLens offers three methods:

| Method | Best for | How it works |
|--------|----------|-------------|
| **CompLens Standard (L1–L10)** | Most organisations | Pre-populated 10-level framework with professional-grade dimensional descriptions. Customise to fit your organisation. |
| **CompLens Assistant** | Tailored structures | Describe your organisation (size, industry, complexity) and the AI generates a custom leveling structure with dimensional descriptors for each level. |
| **Manual** | Full control | Define each level from scratch, writing your own dimensional descriptors. |

### Example: How Levels Differ Across Dimensions

To illustrate how the 6 dimensions distinguish between levels, here are excerpts from the CompLens Standard framework:

**L1 — Support / Intern**

| Dimension | Descriptor |
|-----------|-----------|
| Problem Solving | Solves routine, well-defined problems using documented procedures and close guidance |
| Accountability & Impact | Accountable for completing assigned tasks accurately and on time. Errors are caught by supervision |
| People Leadership | No direct reports. Receives mentoring from more senior colleagues |
| Knowledge & Expertise | Foundational knowledge; actively learning core concepts and tools of the domain |
| Communication & Influence | Communicates within immediate team. Asks questions, reports progress |
| Autonomy & Decision Rights | Works under close supervision with detailed instructions. Escalates all non-routine decisions |

**L5 — Lead / Staff**

| Dimension | Descriptor |
|-----------|-----------|
| Problem Solving | Tackles complex, cross-functional problems. Develops new approaches when existing methods fall short |
| Accountability & Impact | Accountable for workstream or project outcomes. Decisions affect team productivity and quality |
| People Leadership | May lead a small team (2–5) or act as technical lead without formal reports. Mentors and coaches |
| Knowledge & Expertise | Deep expertise in core domain with solid understanding of adjacent areas. Recognised internally |
| Communication & Influence | Communicates across functions and with senior stakeholders. Influences technical and process decisions |
| Autonomy & Decision Rights | Drives own agenda within strategic direction. Makes independent decisions on approach and methodology |

**L8 — Director**

| Dimension | Descriptor |
|-----------|-----------|
| Problem Solving | Addresses ambiguous, multi-stakeholder problems with significant financial and organisational impact |
| Accountability & Impact | Accountable for department-level P&L, strategic outcomes, and talent development pipeline |
| People Leadership | Leads 30–80+ staff across multiple teams. Hires, develops, and promotes managers |
| Knowledge & Expertise | Expert across multiple domains. External thought leader. Shapes industry practices |
| Communication & Influence | Presents to C-suite and board. Represents the organisation externally. Shapes company positioning |
| Autonomy & Decision Rights | Sets department direction autonomously. Makes binding commitments for the organisation |

The full L1–L10 framework is pre-populated in both German and English when you select the CompLens Standard. Every level is fully editable — adapt the descriptors to match your organisation's language and reality.

### Why 6 Dimensions Matter

Single-line job descriptions fail in three critical ways:

1. **They cannot differentiate adjacent levels.** What separates a Senior Professional (L4) from a Lead (L5)? A one-liner cannot capture the nuance. Dimensions like "Autonomy" and "People Leadership" make the distinction concrete and defensible.

2. **They do not satisfy regulators.** Art. 4 requires employers to demonstrate that their job classification uses "objective criteria." A one-sentence description is not defensible in a joint pay assessment. A multi-dimensional evaluation matrix is.

3. **They do not enable AI-powered evaluation.** The JD Upload feature (see 6.6) evaluates uploaded job descriptions against your level definitions. More dimensional detail means more accurate level suggestions.

## 6.3 Job Families & Positions

Job families group related roles together. Typical examples:

- **Engineering** — Software Developer, DevOps Engineer, QA Lead
- **Finance** — Accountant, Financial Controller, Treasury Manager
- **Sales** — Account Executive, Sales Manager, VP Sales
- **Human Resources** — HR Business Partner, Recruiter, C&B Analyst
- **Operations** — Logistics Coordinator, Plant Manager, Supply Chain Director

For each job (position) within a family, you define:

- **Job title and description** — what the role is called and what it does
- **Key responsibilities** — primary duties and accountabilities
- **Required qualifications** — education, certifications, experience
- **Assigned level** — which level in the leveling structure this job sits at
- **Job family assignment** — which family it belongs to

This catalogue becomes your organisation's single source of truth for "what jobs exist and where they sit." When employees are mapped to these jobs (see 6.7), you have a complete, auditable structure that satisfies Art. 4's requirement for objective, gender-neutral job classification.

## 6.4 Competencies

Competency frameworks define the expected behaviours and capabilities at each level. CompLens supports four competency types:

| Type | Scope | Example |
|------|-------|---------|
| **Core competencies** | Apply to all roles across the organisation | Communication, Problem Solving, Teamwork |
| **Leadership competencies** | For people management roles | People Development, Strategic Thinking, Change Management |
| **Technical competencies** | Domain-specific skills | Financial Modelling, Software Engineering, Regulatory Knowledge |
| **Functional competencies** | Role-specific capabilities | Sales Negotiation, Project Management, Data Analysis |

Each competency includes behavioural descriptors per level. For example, "Communication" at L3 might say "Presents work clearly to peers and immediate stakeholders," while at L7 it says "Communicates strategy to senior leadership and represents the function externally."

Competencies are optional but recommended. They strengthen the objectivity of your job evaluation by adding a second layer of evidence beyond the leveling dimensions. For organisations anticipating scrutiny of their pay equity methodology, competency frameworks provide additional defensibility.

## 6.5 Grade Mapping — The Bridge Between Modules

Grade Mapping is where your organisational design (Job Architecture) meets your compensation reality (Salary Bands). It answers the question: **"Which salary grade(s) correspond to which job level?"**

### How It Works

Each level in your leveling structure can be mapped to one or more pay grades. This many-to-many relationship reflects how organisations actually structure pay:

- L3 (Professional) might map to E8, E9a, E9b
- L5 (Lead) might map to E10, E11
- L8 (Director) might map to E13, E14, E15

A one-to-one mapping would force artificial simplification. Real-world organisations, especially those using collective agreements (TVoeD, ERA, Haustarif), have overlapping grade assignments.

### Setting Up Grade Mapping

1. Go to Job Architecture > Grade Mapping tab
2. Each row shows a level from your leveling structure
3. Click **+ Add grade** to assign a salary grade to that level
4. The dropdown shows all grades detected from your employee data and defined in your salary bands
5. Assigned grades appear as chips (e.g., [E10] [E11]) — click the X to remove a mapping

### Why Grade Mapping Matters

Without grade mapping, the Salary Bands module and Job Architecture module exist independently. Grade mapping creates the connection that enables:

- **Auto-mapping of employees to jobs** (Headcount tab) — matching employees to positions based on their pay grade
- **Job-level pay gap analysis** — comparing pay not just within grades but within job levels
- **Connected compliance reporting** — linking Art. 9 salary band compliance to Art. 4 job evaluation

## 6.6 JD Upload — AI-Powered Job Evaluation

If you have existing job descriptions (PDF or Word documents), CompLens can evaluate them automatically against your leveling structure.

### How It Works

1. Upload a job description (PDF or DOCX)
2. CompLens extracts the job title, responsibilities, and qualifications from the document
3. The AI evaluates the role against all levels in your structure, using the 6-dimensional descriptors
4. You receive a suggested level with:
   - **Confidence score** (0–100%) — how certain the AI is about the placement
   - **Reasoning** — a written explanation of why this level was chosen
   - **Extracted details** — title, responsibilities, and qualifications parsed from the document
5. Review the suggestion, adjust if needed, and confirm
6. A draft job record is created in your job catalogue, ready for assignment to a family

### Data Privacy

Only the text of the job description and your level definitions are processed by the AI. No employee names, salaries, or personal data are transmitted. All AI processing occurs through EU-based endpoints.

### When to Use JD Upload

- **Greenfield setup:** You have 50+ existing job descriptions and want to build your catalogue quickly
- **New roles:** A hiring manager sends you a JD and you need to determine the correct level
- **Audit:** You want to verify that existing level assignments match the actual job content
- **Works council discussion:** You need an objective, documented basis for a grading decision

## 6.7 Headcount & Employee Mapping

The Headcount tab connects real employees (from your uploaded datasets) to jobs in your architecture. This is the final step that makes the full structure operational.

### Three Mapping Methods

#### Method 1: Carry Forward (Year-over-Year)

If you mapped employees to jobs last year and are now uploading a new dataset for the current year, CompLens can carry forward prior assignments automatically.

**How it works:**
1. Select the source dataset (e.g., "2025 Annual Export")
2. CompLens matches employees across datasets using the Personalnummer (employee ID)
3. Employees whose grade, title, and department have not changed are automatically carried forward
4. Employees with changes (e.g., promotion, department transfer) are flagged for review
5. New hires (in the new dataset but not the old one) are routed to auto-mapping
6. Leavers (in the old dataset but not the new one) are shown for information

This dramatically reduces the effort of annual compliance cycles. With typical workforce stability of 85–90%, the majority of assignments carry forward without intervention.

#### Method 2: Auto-Mapping (Grade + Title Matching)

CompLens automatically matches employees to jobs based on their pay grade and job title:

1. The system looks at each employee's grade (from payroll data)
2. Via grade mapping, it identifies which job levels correspond to that grade
3. Within those levels, it matches the employee's title to defined jobs
4. Each proposed match includes a confidence score

You review all proposals before confirming. The review interface shows:

- **Summary bar:** e.g., "84 matched | 12 uncertain | 4 unmatched"
- **High-confidence matches** (collapsed by default) — accept all with one click
- **Uncertain matches** — review individually, with alternative suggestions
- **Unmatched employees** — assign manually from the full job catalogue

#### Method 3: Manual Assignment

For any employee, you can open the job catalogue and select the appropriate position directly. This is the right approach for:
- Unique roles that do not match standard patterns
- New positions not yet in the catalogue
- Overriding an auto-mapping suggestion you disagree with

### Audit Trail

Every assignment — whether carried forward, auto-mapped, or manually set — is logged with the method used, the confidence score (if applicable), and the user who confirmed it. This satisfies the Directive's requirement for documented, objective job classification and provides evidence for works council verification under BetrVG Paragraph 80(2).

## 6.8 How Job Architecture Connects to Pay Gap Analysis

With a complete job architecture in place, your pay gap analysis gains a new dimension. Instead of only comparing pay within grades, CompLens can now:

- **Compare pay within job levels** — are employees at the same responsibility level paid equally, regardless of their specific grade?
- **Identify structural anomalies** — is a role graded too high or too low relative to its actual level?
- **Strengthen Art. 4 defensibility** — your job classification is now based on a documented, multi-dimensional, gender-neutral framework
- **Enable year-over-year tracking** — consistent job-level categories allow genuine comparison across reporting periods (Art. 10 progress tracking)

The job architecture does not replace grade-level analysis; it adds a second lens. Art. 9 requires reporting by categories of workers, and the combination of grade-level and job-level analysis provides the most complete picture.

---

# Part 7: Explanations & Justifications (Art. 10)

## When Explanations Are Required

Under Art. 10, when a pay gap exceeds the 5% threshold in any category of workers and the employer cannot justify the difference with objective factors, a joint pay assessment is triggered. But before reaching that conclusion, you need to document which differences **can** be objectively justified.

CompLens identifies every employee whose individual pay deviates significantly from the gender-specific median in their cohort and flags them for explanation.

## Categories of Objective Justification

The EU Directive and established case law recognise several categories of objective justification:

| Category | Example |
|----------|---------|
| **Seniority / Tenure** | Employee has 15 years of service; cohort median has 6 years |
| **Performance** | Documented above-average performance ratings over multiple periods |
| **Market rate / Recruitment** | Role required premium to attract candidate from competitive market |
| **Qualifications** | Additional certifications or degrees beyond role requirements |
| **Shift / Working conditions** | Night shift premium, hazardous environment allowance |
| **Geographic premium** | Higher cost-of-living location |
| **Temporary factors** | Retention bonus during restructuring, transition allowance |
| **Grandfathering** | Legacy salary from pre-merger entity, contractually protected |
| **Collective agreement** | Tariff-mandated step or premium (TVoeD Stufe, ERA Leistungszulage) |
| **Part-time normalisation artefact** | FTE conversion creates apparent gap that does not exist in actual pay |

For each explanation, you specify the category and the **claimed reduction** — how much of the gap this factor accounts for, capped at 25% per explanation. Multiple explanations can be applied to the same employee.

## How Explanations Affect the Adjusted Gap

Each confirmed explanation reduces the unexplained portion of the pay gap. CompLens recalculates the **Tier 3 residual gap** after all explanations are applied. If the residual gap in a category drops below 5%, the joint pay assessment obligation no longer applies for that category.

**Workflow:**
1. Run pay gap analysis (Tier 1 and Tier 2)
2. Review flagged employees (those above the 5% threshold)
3. For each: add one or more explanations with justification text and claimed reduction
4. Mark as "Explained" or "Dismissed" (if no valid justification exists)
5. The Tier 3 residual gap updates automatically
6. Remaining unexplained gaps feed into the remediation planner

## Documentation Best Practices

- **Be specific.** "Market rate" alone is weak. "Market rate: candidate was earning EUR 72,000 at prior employer; our offer of EUR 75,000 was the minimum to secure acceptance, supported by Kienbaum benchmark P75 for this role" is defensible.
- **Cite evidence.** Reference performance reviews, benchmark data, collective agreements, or recruitment records.
- **Date your justifications.** Justifications should reflect the conditions at the time of the pay decision, not post-hoc rationalisation.
- **Review annually.** A justification valid in 2025 (e.g., recruitment premium) may no longer apply in 2027 if the market has shifted.
- **Involve the works council.** Art. 10 contemplates joint assessment with worker representatives. Early involvement strengthens the credibility of your justifications.

---

# Part 8: Remediation Planning (Art. 11)

## Creating Action Plans

When gaps cannot be justified, Art. 11 requires concrete remediation measures. CompLens provides a structured remediation planner for each flagged employee or group.

For each remediation plan, you define:

- **Target employee or group** — who is affected
- **Action type** — what will be done

| Action type | Description |
|-------------|-------------|
| Salary increase | Direct base salary adjustment |
| Bonus adjustment | One-time or recurring variable pay correction |
| Regrading | Move employee to a higher pay grade |
| Process change | Modify the compensation process to prevent future gaps (e.g., structured salary review, market benchmarking mandate) |

## Defining Measurable Steps

Each plan can include detailed steps with:

- **Description** — what specifically will happen
- **Time horizon** — short-term (within 6 months), medium-term (6–18 months), or long-term (2–3 years)
- **Deadline** — specific target date
- **Target salary** — the compensation level after remediation

Steps are tracked individually, allowing you to show incremental progress rather than all-or-nothing completion.

## Budget Simulation

The Budget Simulation Dashboard shows the financial impact of your remediation plans in real time:

- **Current payroll baseline** — total compensation cost based on your imported data
- **Incremental cost by horizon** — how much additional payroll each time horizon adds
- **Total remediation cost** — the full financial commitment if all plans are executed

This helps you present a credible business case to management: "Closing our identified pay gaps will cost EUR X over Y months, distributed as follows..."

The simulation uses your original imported salary data as the baseline to avoid compounding rounding errors when modelling multiple adjustments.

## Tracking Progress

Each remediation plan has a status lifecycle:

```
Open → In Progress → Completed / Dismissed
```

- **Open** — plan created, not yet started
- **In Progress** — steps are being executed
- **Completed** — all steps done, target achieved
- **Dismissed** — plan withdrawn (with documented reason)

Progress is included in your PDF and PowerPoint reports, providing evidence for Art. 10 and Art. 11 compliance. When combined with trend analysis (Part 11), you can demonstrate year-over-year improvement to regulators and worker representatives.

---

# Part 9: Reports & Exports

## PDF Report

CompLens generates a comprehensive PDF report containing all sections required for Art. 9 compliance and beyond:

| Section | Content |
|---------|---------|
| **Cover page** | Organisation name, report period, dataset name, generation date |
| **Executive Summary** | Key metrics at a glance: overall gap (median + mean), adjusted gap, number of flagged employees, compliance status |
| **HR Notes** | Free-text section for your commentary and context |
| **Department Breakdown** | Gap by department with headcount and gender split (optional — not EU-mandatory) |
| **Grades & Quartiles** | Pay gap by grade; quartile distribution by gender (Art. 9 mandatory) |
| **Salary Bands & Compa-Ratio** | Internal band statistics, market comparison, EU compliance status per grade (toggleable) |
| **Explanations** | All documented justifications per employee (Art. 10) |
| **Remediation Plan** | Action plans, steps, timelines, budget impact (Art. 11) |
| **Legal Declaration** | Signature fields for legal representative and worker representative |

**Trial/expired mode:** Reports are watermarked with MUSTER on every page. Content beyond the executive summary is locked with a clear upgrade message.

## PowerPoint Presentation

For board meetings, management presentations, or works council discussions, CompLens generates a 7-slide PowerPoint deck:

| Slide | Content |
|-------|---------|
| 1 | Cover — organisation, period, date |
| 2 | Executive Summary — key gap metrics |
| 3 | Grade analysis — gap by pay grade with compliance flags |
| 4 | Quartile distribution — gender composition per salary quartile |
| 5 | Salary band chart — horizontal range bars with gender medians per grade |
| 6 | EU compliance table — per-grade compliance status with gap percentages |
| 7 | Remediation summary — action plans and budget projection |

**Trial/expired mode:** Slides 3 and beyond are replaced with a locked upgrade screen.

## Trial Watermarking

During the trial period and after expiry, all exports carry a visible **MUSTER** watermark. This allows you to evaluate the quality and completeness of CompLens reports without using trial output as production documents. The watermark is removed immediately upon licence activation.

## Art. 9 Mandatory Reporting Contents

The EU Directive specifies minimum content for the report to the monitoring body:

| Requirement (Art. 9) | Where in CompLens report |
|-----------------------|-------------------------|
| Gender pay gap (median + mean) | Executive Summary |
| Gap in complementary or variable components | Executive Summary (if variable pay data provided) |
| Median gender pay gap by category of workers | Grades & Quartiles section |
| Proportion of female and male workers in each quartile pay band | Grades & Quartiles section |
| Gap between average pay of female and male workers by category | Grades & Quartiles section |

CompLens ensures all mandatory fields are present. Optional sections (e.g., department breakdown) can be toggled on or off in the export settings.

---

# Part 10: Employee Information Rights (Art. 7)

## What the Right to Information Means

Art. 7 gives every worker the right to request and receive information about:

1. Their **individual pay level**
2. The **average pay levels, broken down by gender**, for categories of workers doing the same work or work of equal value

Employers must respond within **two months** of receiving the request. The information must be **accurate and complete.**

This is not a collective reporting obligation — it is an individual right that any employee can exercise at any time. Organisations need a reliable, repeatable process for responding.

## Using the Employee Portal

CompLens includes a self-service employee portal that handles Art. 7 requests without HR manual intervention:

1. An employee accesses the portal (via a separate URL or company intranet link)
2. They identify themselves (employee ID / Personalnummer)
3. CompLens looks up their pay data, identifies their category of workers (based on grade or job level), and calculates the relevant comparison figures
4. The employee sees their individual pay relative to the gender-specific median of their cohort

No other employees' individual data is shown. The portal displays only aggregated statistics for the comparison group.

## The Art. 7 Response Letter (PDF)

In addition to the portal view, CompLens generates a formal **Art. 7 response letter** as a PDF document. This letter:

- Identifies the employee
- States their individual pay level
- Provides the average pay levels by gender for their category of workers
- References the applicable legal basis (Art. 7 of Directive 2023/970)
- Can be signed by the HR department and provided to the employee as a formal response

This letter serves as documentation that the employer has fulfilled their information obligation within the required timeframe.

## Anonymisation Safeguards

When a category of workers contains very few employees, individual identification becomes a risk. CompLens applies anonymisation rules:

- Categories with fewer than a minimum threshold of employees per gender are flagged
- In such cases, the portal shows a notice that detailed comparison is not available due to data protection
- This protects employee privacy while still fulfilling the information obligation to the extent possible

The balance between transparency (Art. 7) and data protection (GDPR) is maintained automatically.

---

# Part 11: Trend Analysis

## Multi-Year Comparison

The Trends module allows you to track your pay gap over time — essential for demonstrating progress under Art. 10 and for annual reporting under Art. 9.

## Dataset Selection

To run a trend analysis, select two or more datasets from different time periods. CompLens compares the key metrics across these snapshots:

- Overall gender pay gap (median and mean)
- Adjusted gap
- Number of flagged employees
- Compliance status per grade

## Standard vs. Comparison Mode

| Mode | What it shows |
|------|--------------|
| **Standard** | Trend line for a single metric over time (e.g., overall gap from 2024 to 2026) |
| **Comparison** | Side-by-side view of two datasets with delta highlighting (green = improved, red = worsened) |

## Department and Grade Heatmaps

The Trends module includes heatmap views that show change over time:

- **Department heatmap:** each cell shows the gap change from the prior period. Green cells indicate improvement; red cells indicate widening gaps.
- **Grade heatmap:** same concept at the grade level — immediately shows which grades are moving toward or away from compliance.

Delta KPIs at the top of the page summarise the overall movement: e.g., "Overall gap: -2.3pp (improved)" or "Flagged employees: +5 (worsened)."

## Using Trends for Art. 10 Progress Tracking

Art. 10 requires employers who have conducted a joint pay assessment to track progress on remediation measures. The Trends module provides the evidence:

- Select the baseline dataset (when the gap was first identified)
- Select the current dataset (after remediation measures have been implemented)
- CompLens shows whether the gap has narrowed, by how much, and in which categories

This data feeds directly into your annual report and provides documented evidence for regulators and worker representatives.

---

# Part 12: Settings & Administration

## Organisation Settings

- **Organisation name and country** — displayed on all reports
- **Legal representative** — Geschaeftsfuehrer name and title (used in contracts and report signature fields)
- **Address** — Firmensitz, PLZ, city
- **VAT ID** — Umsatzsteuer-Identifikationsnummer (required for invoicing)

## Team Management

- **Invite members** — send invitation emails with role assignment (Admin or Viewer)
- **Manage existing members** — change roles, remove access
- **Member profiles** — each member's name and function are visible to the team
- **Seat limits** — your licence includes a set number of seats; additional seats can be purchased

## Subscription and Billing

- **Current plan** — shows your active licence type and validity dates
- **Payment method** — credit card, SEPA Direct Debit, or bank transfer (Vorkasse)
- **Manage subscription** — opens the Stripe Customer Portal for invoice history, payment method changes, and cancellation
- **Pro-forma invoice** — downloadable for budget approval before purchase

Billing is annual. Cancellation must be submitted at least 3 months before the end of the contract period.

## GDPR Compliance

CompLens is designed for the strictest European data protection requirements:

| Aspect | Detail |
|--------|--------|
| **Data residency** | All data stored on EU servers (Supabase, Frankfurt region) |
| **Encryption** | Data encrypted at rest and in transit (TLS 1.3) |
| **AVV (Auftragsverarbeitungsvertrag)** | Auto-generated from your organisation's legal fields; available for download at any time |
| **Licence Agreement** | Auto-generated SaaS licence contract with German law provisions |
| **AI processing** | Optional. When used, only anonymised or non-personal data (column headers, job descriptions, aggregated statistics) is sent to the AI. No employee names or salaries are transmitted. EU-based API endpoints. |
| **Data deletion** | You can delete datasets and all associated data at any time. Account deletion removes all data permanently. |
| **Access control** | Role-based access (Admin/Viewer); individual employee data hidden from Viewer roles |
| **Audit trail** | All significant actions (data upload, analysis runs, explanations, remediation plans, assignments) are logged with timestamp and user |

---

# Part 13: Quick Reference

## EU Directive Article to CompLens Module Mapping

| Directive Article | Requirement | CompLens Module | Where to find it |
|-------------------|-------------|-----------------|-------------------|
| **Art. 4** | Objective, gender-neutral pay criteria | Job Architecture | Dashboard > Job Architecture > Leveling |
| **Art. 4(4)** | Job evaluation methodology | Job Architecture | 6-dimension framework; JD Upload evaluation |
| **Art. 7** | Employee right to pay information | Employee Portal | Dashboard > Portal |
| **Art. 9(1)(a)** | Gender pay gap (organisation-wide) | Pay Gap Analysis | Dashboard > Analysis > Overview |
| **Art. 9(1)(a)** | Gap in variable components | Pay Gap Analysis | Dashboard > Analysis > Overview (total comp) |
| **Art. 9(1)(b)** | Median gap by category of workers | Pay Gap Analysis | Dashboard > Analysis > Grades |
| **Art. 9(1)(c)** | Quartile pay band distribution | Pay Gap Analysis | Dashboard > Analysis > Quartiles |
| **Art. 9** | Salary band reporting | Salary Bands | Dashboard > Salary Bands |
| **Art. 9** | 5% threshold / joint pay assessment trigger | Salary Bands | Compliance Heatmap |
| **Art. 10** | Objective justification of pay differences | Explanations | Dashboard > Analysis > Explanations |
| **Art. 10** | Joint pay assessment and progress tracking | Trend Analysis | Dashboard > Trends |
| **Art. 11** | Remediation of unjustified pay differences | Remediation Planner | Dashboard > Remediation |

## Glossary

| Term | Definition |
|------|-----------|
| **Adjusted gap** | Gender pay gap after accounting for Wage Influencing Factors (WIF) such as grade, tenure, and department |
| **Art. 7 letter** | Formal response to an employee's right-to-information request, generated as PDF |
| **AVV** | Auftragsverarbeitungsvertrag — GDPR data processing agreement between controller and processor |
| **Cohort** | A group of employees compared for pay gap purposes (e.g., all employees in grade E11) |
| **Compa-ratio** | Internal median salary divided by band midpoint, times 100. Measures how actual pay compares to target pay |
| **Compliance heatmap** | Visual summary showing EU Art. 9 compliance status (green/red) for each pay grade |
| **Entgeltgruppe** | Pay grade in German collective agreement terminology (e.g., E9a, E11, E15) |
| **FTE** | Full-time equivalent — normalised salary assuming full-time working hours |
| **GPG** | Gender pay gap — the percentage difference between male and female pay |
| **Intra-grade gap** | Gender pay gap within a single pay grade — the most compliance-relevant metric under Art. 9 |
| **Joint pay assessment** | Mandatory joint review with worker representatives when the adjusted gap exceeds 5% (Art. 9) |
| **Level** | A tier in the job leveling structure (e.g., L1 through L10), defining the scope of responsibility |
| **Leveling structure** | The complete set of levels used by an organisation to classify jobs by responsibility |
| **Market benchmark** | External salary data (e.g., from Kienbaum, Radford) used to compare internal pay to the market |
| **P25 / P50 / P75** | Percentiles of a salary distribution. P50 is the median (middle value) |
| **Quartile** | One of four equal groups when all employees are ranked by salary. Art. 9 requires gender breakdown per quartile |
| **Residual gap** | The pay gap remaining after documented objective justifications have been applied (Tier 3) |
| **Stufe** | Seniority step within a pay grade (common in TVoeD, ERA). Determines salary progression based on years in grade |
| **Tariff / Tarifvertrag** | Collective agreement that defines pay grades and conditions for covered employees |
| **Unadjusted gap** | The raw gender pay gap with no adjustments — the headline figure reported under Art. 9 |
| **WIF** | Wage Influencing Factors — objective characteristics (grade, tenure, education, etc.) used to calculate the adjusted gap |

## Recommended Workflow: From Zero to Compliant

This step-by-step guide takes you from initial setup to full EU compliance:

| Step | Action | Time estimate | Prerequisite |
|------|--------|--------------|--------------|
| 1 | **Register** and complete organisation setup | 5 minutes | None |
| 2 | **Upload payroll data** (CSV or Excel from your HR system) | 5 minutes | Payroll export |
| 3 | **Review AI column mapping** and confirm | 2 minutes | Step 2 |
| 4 | **Create salary bands** — click "Detect Bands" | 1 minute | Step 2 |
| 5 | **Review compliance heatmap** — identify grades above 5% | 5 minutes | Step 4 |
| 6 | **Add market benchmarks** (optional but recommended) | 15–30 minutes per source | Step 4 |
| 7 | **Create leveling structure** — use L1–L10 template or build custom | 30–60 minutes | None |
| 8 | **Define job families and positions** | 1–3 hours depending on org size | Step 7 |
| 9 | **Map grades to levels** | 15–30 minutes | Steps 4 and 7 |
| 10 | **Map employees to jobs** (auto-map + review) | 30–60 minutes | Steps 8 and 9 |
| 11 | **Run pay gap analysis** | 1 minute (automated) | Step 2 |
| 12 | **Add explanations** for flagged employees (Art. 10) | 1–4 hours depending on gap count | Step 11 |
| 13 | **Create remediation plans** for unjustified gaps (Art. 11) | 1–2 hours | Step 12 |
| 14 | **Generate PDF report** | 1 minute | Steps 11–13 |
| 15 | **Configure employee portal** for Art. 7 requests | 15 minutes | Step 2 |
| 16 | **Invite works council** as Viewer | 5 minutes | None |

**Total estimated time for first-year compliance:** 1–2 working days for a 200-person organisation, compared to 4–8 weeks with a traditional consultant engagement.

**Subsequent years:** With carry-forward mapping and trend analysis, annual updates take 2–4 hours.

---

*CompLens is a product of DexterBee GmbH. All data is processed on EU servers in accordance with GDPR. This handbook is provided for informational purposes and does not constitute legal advice. Organisations should consult qualified legal counsel for directive-specific compliance questions.*

*For support, use the in-app Help Centre (Dashboard > Help) or contact hallo@complens.de.*
