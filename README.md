# CompLens — EU Pay Transparency Platform

> **Entgelttransparenz. Einfach. Sicher. Gemacht in Deutschland.**

CompLens is a SaaS platform that helps German and European companies comply with the **EU Pay Transparency Directive (2023/970/EU)** — statutory reporting deadline: **7 June 2026**.

> 📖 This README is the **single source of truth** for the project. The old `docs/product/MASTER_PLAN.md` has been retired and its content consolidated here. Do not maintain separate plans.

---

## Table of Contents

1. [What CompLens Does](#what-complens-does)
2. [Positioning & Messaging](#positioning--messaging)
3. [Commercial Model & Pricing](#commercial-model--pricing)
4. [Repository Structure](#repository-structure)
5. [Tech Stack](#tech-stack)
6. [Database Schema](#database-schema)
7. [Feature Reference — All Modules](#feature-reference)
8. [Completed Work](#completed-work)
9. [Remaining Work](#remaining-work)
10. [Acquisition & Marketing](#acquisition--marketing)
11. [Trial & Conversion Strategy](#trial--conversion-strategy)
12. [CRM & Customer Lifecycle](#crm--customer-lifecycle)
13. [SEO Strategy](#seo-strategy)
14. [Landing Page & Video Sales Letter](#landing-page--video-sales-letter)
15. [Analytics & Tracking](#analytics--tracking)
16. [GDPR & Security](#gdpr--security)
17. [Running Locally](#running-locally)

---

## What CompLens Does

CompLens covers the full EU Pay Transparency compliance lifecycle:

| Step | What happens |
|------|-------------|
| **1. Import** | Upload CSV/Excel from any HR system. AI maps columns automatically |
| **2. Analyse** | Compute unadjusted & adjusted pay gaps with WIF (Wage Influencing Factors) |
| **3. Explain** | Per-employee explanations with EU Art. 10 objective justification |
| **4. Remediate** | Structured action plans to close gaps (Art. 11) |
| **5. Salary Bands** | Internal pay bands auto-computed from employee data; EU Art. 9 intra-grade compliance; market benchmarks |
| **6. Report** | Generate legally compliant PDF + PowerPoint reports |
| **7. Portal** | Employee right-to-information self-service (Art. 7) |

---

## Positioning & Messaging

### Target Buyer

**ICP (Ideal Customer Profile):**
- HR Directors, Compensation & Benefits Managers, CFOs — DACH region
- Companies with **100–500 employees** (staggered EU reporting: ≥150 first, then ≥100)
- Industries: Manufacturing, financial services, healthcare, Öffentlicher Dienst
- Currently using: manual Excel processes or €15,000+ HR consultant audits

### Core Value Propositions

| Message | Detail |
|---------|--------|
| **Deadline urgency** | "7 June 2026 — EU Directive transposition. Sind Sie bereit?" |
| **Cost savings** | Replaces €15,000–25,000/yr HR consultant audits at a fraction of the cost |
| **Speed** | "Erfüllen Sie die EU-Meldepflicht in unter 5 Minuten" |
| **GDPR trust** | "Ihre Gehaltsanalyse verlässt nie unsere EU-Server. KI ist optional." |
| **Completeness** | Art. 7 + Art. 9 + Art. 10 + Art. 11 — full directive coverage in one tool |

### Competitive Landscape

| Competitor | Model | Est. Price Range | Our Edge |
|-----------|-------|-----------------|----------|
| **Figures HR** | Annual SaaS | €1,700–€7,300/yr (avg €4,300) | German-first, GDPR-stronger, EU law focus |
| **Sysarb** | Custom by headcount | ~€5,000–€20,000/yr | Simpler UX, faster time-to-report |
| **Syndio** | Enterprise | ~€20,000–€80,000/yr | Accessible mid-market price |
| **beqom** | Enterprise module | CHF 50,000/yr+ | Mid-market SaaS vs. enterprise module |
| **HR Consultant (manual)** | Project-based | €15,000–€25,000/yr | Automated, repeatable, no re-engagement cost |

> **Positioning:** Market tolerates €2,500–€8,000/yr for focused SaaS tools. At €5,990/yr we are at the high end of Figures but substantially below Sysarb and deliver full automation what consultants do manually.

---

## Commercial Model & Pricing

### Plans

| Plan | Label in App | Price | Included seats | AI |
|------|-------------|-------|---------------|----|
| Trial | TEST | Free, 7 days | 1 | Full AI access |
| CompLens Lizenz | LIZENZ (`paylens` / `paylens_ai`) | **€ 5.990/Jahr** + MwSt. | 1 HR-Admin + 1 works-council reader | ✅ |
| Add-on seat | — | € 990/Platz/Jahr | Additional users | — |

> Billing: annual. Cancellation: 3 months before end of contract.

### Payment Methods
- **Stripe Checkout**: credit card + SEPA Direct Debit
- **Bank transfer (Vorkasse)**: PDF invoice — essential for German B2B where company credit cards are uncommon. Invoice term: 14 days.

### Plan Gating in Code
- `plan` column on `organisations` table: `trial`, `paylens`, `paylens_ai`
- `trial_ends_at` timestamps the 7-day window
- `lib/api/planGuard.ts` — centralised API middleware for plan checks
- `lib/plans.ts` — feature matrix
- Stripe webhook sets plan on payment, clears `trial_ends_at`

---

## Repository Structure

```
PayLens/
├── apps/
│   └── web/                  Next.js 16 SaaS application
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/           Login, register, invite, join flows
│       │   │   ├── (dashboard)/      All authenticated dashboard pages
│       │   │   │   └── dashboard/
│       │   │   │       ├── analysis/      Pay gap analysis + chatbot + pay overrides (+ Band tab)
│       │   │   │       ├── compliance/    Trends & compliance overview
│       │   │   │       ├── datasets/      Dataset management
│       │   │   │       ├── help/          In-app support ticket submission
│       │   │   │       ├── import/        CSV/Excel import + AI mapping
│       │   │   │       ├── onboarding/    Guided first-use flow
│       │   │   │       ├── portal/        Employee right-to-info portal
│       │   │   │       ├── remediation/   Action plan management
│       │   │   │       ├── reports/       Report viewer + export
│       │   │   │       ├── salary-bands/  🆕 Internal pay bands + EU Art. 9 compliance
│       │   │   │       ├── settings/      Org settings, team, plan, legal, security
│       │   │   │       └── trends/        Historical pay gap trends
│       │   │   ├── (public)/          Public-facing pages (readiness check, booking)
│       │   │   ├── agb/               AGB (Terms) legal page
│       │   │   ├── datenschutz/       Datenschutzerklärung legal page
│       │   │   ├── impressum/         Impressum legal page
│       │   │   ├── api/
│       │   │   │   ├── analysis/          Run pay gap calculations
│       │   │   │   ├── chat/              AI chatbot (Gemini 2.5 Pro)
│       │   │   │   ├── contact/           Contact form (Resend)
│       │   │   │   ├── contracts/         AVV + license contract generation
│       │   │   │   ├── portal/            Employee portal API
│       │   │   │   ├── profile/           User profile updates
│       │   │   │   ├── report/            PPT export
│       │   │   │   ├── reports/           PDF export (incl. salary band section)
│       │   │   │   ├── stripe/            Stripe checkout + webhook
│       │   │   │   └── support/           Support ticket CRUD + AI triage + polish
│       │   │   └── superadmin/            Internal admin panel (email-allowlist gated)
│       │   ├── components/
│       │   │   ├── dashboard/             Layout, sidebar, header, banners, overlays +
│       │   │   │                          BandVisualizationChart.tsx, ComplianceHeatmap.tsx
│       │   │   └── ui/                    Shared UI primitives
│       │   └── lib/
│       │       ├── api/                   planGuard, superadminAuth, parseBody helpers
│       │       ├── band/                  🆕 getBandContext.ts — unified salary band data layer
│       │       ├── calculations/          Core pay gap engine (WIF, quartiles, flags)
│       │       ├── chatbot/               Chatbot context builder
│       │       ├── i18n/                  LanguageContext + translations (DE/EN)
│       │       ├── pdf/                   ReportDocument.tsx (react-pdf, incl. band section)
│       │       ├── ppt/                   ReportPresentation.ts (pptxgenjs)
│       │       ├── plans.ts               Plan gating + feature matrix
│       │       └── supabase/              Client + server + admin Supabase helpers
├── database/
│   └── migrations/              23 sequential SQL migrations (Supabase)
├── landing/                     Astro static marketing site
├── docs/                        Dev status, legal reference docs
└── .agent/                      AI assistant workflows and skills
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Supabase (PostgreSQL, RLS, EU Frankfurt) |
| Auth | Supabase Auth (email + magic link) |
| Styling | Vanilla CSS + CSS variables (dark mode design system) |
| PDF Export | `@react-pdf/renderer` |
| PPT Export | `pptxgenjs` |
| AI | Google Gemini 2.5 Pro (import mapping, chatbot, explanations, narrative, support polish) |
| Email | Resend (`hallo@complens.de`) |
| Payments | Stripe (subscription checkout + webhook + SEPA) |
| Hosting | Vercel |
| Landing | Astro (zero-JS, SEO-optimised) |
| i18n | Custom LanguageContext (DE/EN, persisted per user) |
| Analytics | GA4 via `@next/third-parties/google` — ⚠️ needs `NEXT_PUBLIC_GA_MEASUREMENT_ID` set |

---

## Database Schema

23 migrations in order:

| # | Migration | Purpose |
|---|-----------|---------| 
| 001 | `initial_schema` | Organisations, users, datasets, analyses, results |
| 002 | `storage_bucket` | Supabase storage for uploaded files |
| 003 | `employee_names` | Name fields on individual_flags |
| 004 | `working_hours` | Weekly hours, part-time handling |
| 005 | `additional_compensation` | Variable pay, bonus fields |
| 006 | `pay_gap_explanations` | Art. 10 individual explanations table |
| 007 | `explanation_multi_category` | Multi-category JSON on explanations |
| 008 | `report_metadata` | Report notes, signatory names |
| 009 | `archive_delete` | Soft archive + hard delete for datasets/analyses |
| 010 | `pay_overrides` | Manual salary adjustment overrides |
| 011 | `remediation_plans` | Art. 11 remediation plan records |
| 012 | `explanations_rls` | Row-level security for explanations |
| 013 | `remediation_plan_steps` | Detailed step breakdown per plan |
| 014 | `user_events_crm` | Event tracking for CRM / trial lifecycle |
| 015 | `invitations_devices` | Team invitations + device fingerprints |
| 016 | `member_profile_fields` | Name + function fields for invited members |
| 017 | `preferred_language` | DE/EN language preference per user |
| 018 | `org_legal_fields` | Legal rep, address, city, ZIP, VAT ID for contracts |
| 019 | `support_tickets` | Internal support ticket system with AI triage |
| 020 | `leads` | Lead capture table |
| 021 | `pay_overrides_delete_rls` | RLS fix for pay overrides deletion |
| 022 | `salary_bands` | `salary_bands`, `salary_band_grades` + auto-computed stats + market data |
| 023 | `salary_band_summary_view` | `salary_band_summary` view — EU compliance flags, intra-grade gap, compa-ratio |

---

## Feature Reference

### Authentication & Onboarding
- Email/password registration with 7-day trial activation
- Email confirmation + organisation setup on first login
- **Team invitations** — HR manager sends invite links; invited users can set their name and function on join
- Guided **onboarding modal** (5 steps: upload → analyse → explain → remediate → report)

### Import Module
- Drag-and-drop CSV or Excel upload (any HR system export)
- **AI column mapping** — Gemini 2.5 Pro reads column headers and maps to the CompLens schema automatically
- Manual column mapping fallback
- Validation layer: minimum fields, working hours normalisation, anonymisation check
- Trial limit: max 10 employees per dataset

### Analysis Module
- **Three-tier pay gap** (EU Art. 9 & 10):
  - Tier 1 — Unadjusted (raw, mandatory)
  - Tier 2 — Structurally adjusted / WIF-adjusted (mandatory)
  - Tier 3 — After-explanations residual (Art. 10)
- By department, by pay grade, by salary quartile
- Individual employee flags (|gap| ≥ 5% threshold)
- **Median + mean** for all tiers (EU Directive requires both)
- 5% threshold alert triggering Art. 9(1)(c) joint assessment requirement
- **Pay overrides** — manually correct salaries before analysis runs
- **AI chatbot** (Gemini 2.5 Pro) — floating panel available on all pages; understands org context, analysis results, and EU directive rules

### Explanations (Art. 10)
- Per-employee objective justification workflow
- 10+ EU-recognised categories (seniority, performance, market rate, etc.)
- Claimed % reduction per category, capped at 25%
- Status: open → explained / dismissed
- Feeds Tier 3 residual gap calculation

### Remediation Planner (Art. 11)
- Create action plans per flagged employee
- Action types: salary increase, bonus adjustment, regrading, process change
- Plan steps with horizon (short / medium / long-term), deadline, description, target salary
- **Budget Simulation Dashboard**: Real-time widget mapping incremental payroll costs across time horizons based purely on initial imported data to avoid recursive rounding errors.
- Status tracking: open → in_progress → completed / dismissed
- Feeds into PDF + PPT report sections

### Reports Module
- **Interactive report viewer** — full on-screen version of the report with all sections
- **PDF export** (`@react-pdf/renderer`):
  - Cover page, Executive Summary, HR Notes, Department Breakdown, Grades & Quartiles, Explanations, Remediation Plan, Legal Declaration with signature fields
  - Trial/expired mode: MUSTER watermark on every page; content locked from page 5 onwards
- **PPT export** (`pptxgenjs`):
  - Cover, Executive Summary, Grades, Quartiles, Flagged employees, Department breakdown, Remediation summary
  - Trial/expired mode: MUSTER watermark on every slide; slides 3+ replaced by locked upgrade slide
- Both exports detect `sampleMode: 'trial' | 'expired'`

### Salary Bands Module (EU Art. 9 — NEW ✅)
- **Auto-detection** of grade naming schemes from employee data (G-scale, L-scale, TVöD, TV-L, ERA, etc.)
- **One-click band generation**: `createBandFromDetectedGrades` creates `salary_bands` + `salary_band_grades` rows and immediately computes statistics
- **Internal statistics** (P25/Median/P75, min/max, ♀/♂ medians, n) computed from actual employee salaries
- **Compa-ratio**: internal median ÷ band midpoint × 100 (EU Art. 9 transparency)
- **EU Art. 9 compliant heatmap**: binary red/green compliance per grade (< 5% = compliant)
- **BandVisualizationChart**: horizontal box-plot SVG; base pay vs. total compensation toggle; market benchmark overlay
- **ComplianceHeatmap**: Art. 9 reporting table with intra-grade gap, gender medians, compa-ratio
- **Market benchmarks**: optional per-grade entry (Kienbaum, Radford, StepStone, etc.) stored in `salary_band_market_data`
- **Unified data layer**: `getBandContext()` server action — single source of truth for Dashboard, Analysis, Remediation, Reports
- **Dashboard integration**: 7th KPI card (EU-konforme Gruppen X/Y) + clickable alert when non-compliant
- **Analysis integration**: 3rd tab 'Entgeltbänder (Art. 9)' showing band chart + compliance heatmap
- **PDF export**: new 'Entgeltbänder & Compa-Ratio' section (togglable in PdfOptionsModal)
- **Sidebar**: dedicated `/dashboard/salary-bands` route with unique **Landmark** icon

### Analysis Module
- **Compliance dashboard** — at-a-glance status against EU Art. 9 requirements
- **Trends module** — year-over-year comparison when multiple analyses exist

### Employee Portal (Art. 7)
- Employee self-service: look up their own pay gap vs. cohort median
- Generates an Art. 7 Right-to-Information response letter (PDF)
- Accessible via a separate portal URL / token

### Help & Support
- **In-app Help Centre** (`/dashboard/help`) — users submit tickets with subject, category, message
- AI triage: Gemini auto-classifies category, priority, writes summary + draft reply
- Admin manages tickets in superadmin Support tab: filters, multi-turn threads, AI draft + polish
- Status flow: open → in_progress → waiting → resolved / wont_fix

### Settings
- **Organisation** — name, country, reporting defaults; legal fields (Geschäftsführer, Firmensitz, PLZ, VAT ID)
- **Team** — invite members, manage roles; name + function fields
- **Plan & Billing** — current plan, license dates, Stripe checkout, **pro-forma invoice download** (with payment method selector: card / SEPA / Vorkasse)
- **Language** — DE/EN preference per user, persisted to DB
- **Security** — EU server info, GDPR notes, data deletion

### Contracts
- **AVV** — auto-generated GDPR DPA from org legal fields
- **License Agreement** — auto-generated SaaS license contract

### Legal Pages (in-app)
- `/agb`, `/datenschutz`, `/impressum`

### Superadmin Panel (`/superadmin`)
- Email-allowlist auth (`SUPERADMIN_EMAILS` env var) — no query-string key
- `superadminAuth.ts` centralises check for all 7 action routes
- User/org list with plan, trial status, dataset/analysis counts
- Activate/extend licenses; suspend or delete accounts
- Trial-expiring-soon view (< 48h)
- Bulk email to trial / expired / licensed segments (batched, Resend)
- AI email polish before sending
- AI key findings + action plan per org
- **Support tab** — full ticket management with AI draft replies

### Plan Gating & Trial System
- TrialBanner countdown; TrialExpiredOverlay full-screen block
- PDF/PPT MUSTER watermarks tied to `sampleMode`
- Stripe webhook activates license on payment

### Internationalisation (DE/EN)
- `LanguageContext` + `translations.ts`
- Preference stored in `organisation_members.preferred_language`

### Email (Resend)
- Welcome email, team invitations, admin bulk emails, support replies
- Branded HTML templates with CompLens gradient header, bilingual footer

---

## Completed Work

### Phase 2 ✅

| Feature | Details |
|---------|---------|
| PPT export | Full 7-slide PowerPoint with charts, tables, grade/quartile, department, remediation |
| PDF MUSTER watermark | Front-rendered, opaque on all pages in trial/expired mode |
| PDF + PPT content locking | Pages/slides 3–5+ replaced with locked upgrade screen |
| Trial vs. expired messaging | Context-aware German copy in both PDF and PPT |
| TrialExpiredOverlay | Full-screen dark overlay; direct Stripe CTA |
| sampleMode detection | `'trial' \| 'expired' \| null` computed from `trial_ends_at` |
| Team invitations | Email, join page, name + function on join |
| Member profile fields | Name + function saved per user |
| Mean salary fields | Both median and mean for all tiers |
| AI chatbot | Gemini 2.5 Pro floating panel on all pages |
| Onboarding modal | 5-step guided first-use flow |
| Pay overrides | Manual salary correction before analysis |
| Interactive report viewer | Full on-screen report |

### Phase 3 ✅

| Feature | Details |
|---------|---------|
| Superadmin email-allowlist auth | `SUPERADMIN_EMAILS` replaces old `?key=` / `ADMIN_SECRET` |
| Support ticket system | Migration 019; users submit via `/help`; full admin management |
| AI ticket classification | Auto-assigns category, priority, summary, draft reply |
| AI reply polish | Admin refines draft before sending; bilingual DE/EN toggle |
| Multi-turn ticket threads | JSONB `messages` array per ticket |
| i18n (DE/EN) | LanguageContext + translations; persisted per user (migration 017) |
| Contract generation | AVV + License from org legal fields (migration 018) |
| Legal pages | `/agb`, `/datenschutz`, `/impressum` |
| planGuard helper | Centralised plan-check middleware for all API routes |
| Superadmin suspend / delete | Account management from admin panel |
| Viewer (read-only) roles | Strict enforcement of read-only access, hidden config menus |
| Analysis Privacy | Individual employee data tab hidden from viewer roles |
| Full-Stack Lead Capture | `/api/leads` endpoint + Supabase DB `leads` + Admin Panel integration |
| Frictionless UI Onboarding | Pre-Check funnel natively integrated with 1-click password signup flow |
| Admin Panel Polish | Urgency & Account Status badges, deep visual contrast improvements |
| **Remediation Budget Simulation** | `BudgetSimPanel` — real-time payroll baseline + incremental cost projection per horizon (6m/1y/18m/2-3y) using raw import fields |
| **Support email delivery** | Admin reply fires branded Resend email to user; fire-and-forget after DB update |
| **Stripe Customer Portal** | `POST /api/stripe/portal` — licensed orgs redirect to Stripe-hosted billing management |
| **Manage Subscription button** | Settings → Abonnement tab shows "Abonnement verwalten" for licensed orgs |
| **Trial overlay → ticket link** | "Support kontaktieren" routes to `/dashboard/help` instead of `mailto:` |
| **Stripe German invoicing** | Template wired to checkouts; `preferred_locales: ['de']`; German product names per §14 UStG |
| **Trends module** | Full SVG line chart, department & grade heatmaps, delta KPIs, year-over-year table |
| **Salary Band module** | Auto-detect, compute, visualize, market-benchmark, EU Art. 9 compliance per grade |
| **Band in PDF export** | New ‘Entgeltbänder & Compa-Ratio’ section in ReportDocument (togglable) |
| **Band in Analysis** | 3rd tab ‘Entgeltbänder (Art. 9)’ in AnalysisPage |
| **Band on Dashboard** | 7th KPI card + linked alert when any grade fails Art. 9 |
| **Stripe real price IDs** | `STRIPE_PRICE_LICENSE` + `STRIPE_PRICE_ADDITIONAL_ACCESS` set and wired in checkout + webhook |
| **Stripe webhook live** | `/api/stripe/webhook` active; `STRIPE_WEBHOOK_SECRET` configured |
| **Resend email** | `RESEND_API_KEY` + `RESEND_FROM_EMAIL` configured; all email flows functional |
| **All env vars set** | Supabase, Gemini, Resend, Stripe, `SUPERADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` |
| **PPT: IQR chart slide** | New `addSalaryBandChartSlide` — horizontal range bars with P25/median F./median M./P75 per grade |
| **PPT: EU compliance labels** | `✓ ok` / `⚠ n.k.` (was `Nein` / `Ja`) — consistent with PDF |
| **PPT: Dept slide removed** | Department drilldown slide removed; replaced by 2 EU-mandatory band slides |
| **PPT/PDF/Web: title consistency** | All outputs use user-given dataset name, not internal “Analyse YYYY” |
| **PDF: Bereiche optional** | Departments section off by default in PDF modal (not EU Art. 9 mandatory) |
| **Web: compliance clarity** | “Nicht EU-Pflicht” badge on Bereiche section in interactive report |
| **GA4 Analytics** | `NEXT_PUBLIC_GA_MEASUREMENT_ID` set; `GoogleAnalytics` component in `layout.tsx` — fully active |
| **TypeScript** | `tsc --noEmit` → 0 errors |

---

## Remaining Work

### 🟡 Medium — Important Before Launch

| Task | Notes |
|------|-------|
| **Add-on seat E2E test** | Route implemented; needs real SEPA/card payment end-to-end test |
| **Compliance dashboard** | Dynamic Art. 9 sub-requirement status per org |
| **Employee portal polish** | Art. 7 PDF letter final UX review |
| **Hero Showcase Carousel** | Astro landing page — awaiting 6 dashboard screenshots from live server |

### 🟢 Low — Post-Launch / Nice-to-Have

| Task | Notes |
|------|-------|
| **Custom email domain** | Verify `hallo@complens.de` in Resend dashboard |
| **Dataset comparison** | Side-by-side year-over-year diff view |
| **GDPR / AVV end-to-end test** | Confirm contract PDF download with real org legal fields |
| **Plausible Analytics** | Cookie-free GDPR stats — add `<script>` to Astro layout |
| **Dead code cleanup** | `addSlide3` in `ReportPresentation.ts` — unused, harmless |
| **TOMs document** | Technical + organisational measures PDF — needed before go-live |
| **Lawyer review** | AGB + AVV review — budget ~€3,000–5,000 |

---

## Acquisition & Marketing

### Google Ads — DE Keywords (€2,000–5,000/mo target)

| Keyword | Intent |
|---------|--------|
| `Entgelttransparenzgesetz Software` | HIGH — compliance buyers |
| `Gender Pay Gap berechnen Tool` | informational + product |
| `EU Entgelttransparenzrichtlinie Umsetzung` | compliance decision-makers |
| `Lohngleichheit Analyse Software` | HR managers |
| `Trusaic Alternative` | competitor capture |
| `Haufe Entgelttransparenz Alternative` | competitor capture |

Start campaigns on these **after** landing page is live and GA4 conversion tracking is configured.

### LinkedIn Ads (Phase 2, €1,500/mo)
- Audience: HR Directors, C&B Managers, CFOs — DACH region
- Format: thought leadership around the June 2026 deadline
- Activate once Google Ads is profitable (conversion data available)

### PR / content distribution
- Target press: Personalwirtschaft, HR-Themen.de, HR Pulse
- Press release on public launch (7 June 2026 deadline hook)
- Backlink outreach from pillar articles → HR publications

---

## Trial & Conversion Strategy

- **7-day free trial** — full product access, no credit card required
- **During trial: PDF/PPT exports are watermarked (MUSTER) and locked** — visible but not extractable. Prevents using trial as a one-off free analysis.
- **TrialExpiredOverlay** — full-screen block on all dashboard routes after expiry. Single Stripe CTA.
- Reminder email sequence: D-3 and D-1 before trial end (wire via Resend + CRM)
- **Conversion messaging in-app**: German copy, "Testzeitraum abgelaufen" vs. "Testmodus" — context-aware
- Trial limit on import: max 10 employees per dataset

---

## CRM & Customer Lifecycle

**Tool**: HubSpot Free → Starter → Marketing Hub Pro as revenue scales

```
Visitor → Lead → Trial → Customer → Retained → Expanded → Advocate
```

| Stage | Trigger | Action |
|-------|---------|--------|
| Lead | Contact form / content download | Nurture sequence (3 emails, 2 weeks) |
| Trial start | Supabase signup | Onboarding email D0, D3, D7 |
| Trial → customer | Stripe payment | Welcome + optional success call |
| At-risk | No login in 7 days | Automated check-in email |
| Renewal | 30/7 days before | Reminder + upgrade offer |
| Advocate | Long-tenure | Request testimonial / case study |

**User lifecycle events** tracked in `user_events_crm` table (migration 014) — feed into HubSpot via webhook.

---

## SEO Strategy

### Technical SEO (Astro landing site)
- Target: 100/100 Lighthouse performance, accessibility, best practices
- `sitemap.xml` + `robots.txt` auto-generated
- Canonical tags, `hreflang` (de, en) on all pages
- Schema.org structured data: `SoftwareApplication`, `FAQPage`, `Product`
- Core Web Vitals targets: LCP < 2.5s, INP < 200ms, CLS < 0.1

### Content Pillars (German-first, publish from April 2026)

```
Pillar: EU Entgelttransparenzrichtlinie — Der vollständige Leitfaden (4,500 words)
├── Was ist die EU-Entgelttransparenzrichtlinie?
├── Wer ist betroffen? (Unternehmen ab 100 MA)
├── Was ist der Gender Pay Gap? (bereinigt vs. unbereinigt)
├── Was muss im Bericht enthalten sein? (Mittelwert, Median, Quartile)
├── Was ist eine gemeinsame Entgeltbewertung? (5%-Schwelle)
├── Auskunftsrecht der Mitarbeitenden (Art. 7)
├── Wie bereite ich mein Unternehmen vor?
├── WIF — Wage Influencing Factors erklärt
├── EU-Richtlinie vs. deutsches EntgTranspG — Was ändert sich?
├── Berichtspflichten nach Unternehmensgröße
├── Beweislastumkehr — was bedeutet das für Arbeitgeber?
├── Gehaltsbänder und Entgelttransparenz bei Stellenausschreibungen
└── [Vergleich] CompLens vs. Trusaic vs. Haufe
```

**Publishing cadence:** 1 cluster article/month from April 2026. Cluster articles: 1,000–1,500 words.

**Local/DACH SEO:** `complens.de` primary domain (`.de` = trust signal). DE-first content, EN secondary.

---

## Landing Page & Video Sales Letter

The Astro landing site (`/landing`) is built. Key sections needed before launch:

### UI Showcase (replaces "Book a Demo")
Self-serve product tour — no meeting required. High-friction demo calls eliminated.

Annotated screenshot carousel (6–8 screens):
1. Dashboard — pay gap KPIs + traffic-light dept status
2. Import wizard — AI column mapping with confidence scores
3. Adjusted pay gap — WIF breakdown
4. Quartile distribution chart
5. Remediation planner
6. PDF / PPT report preview

### Hero Showcase Carousel (Replaces VSL)
- **Format**: Interactive, auto-playing carousel of 6 high-fidelity UI cards (mockups + highlighted feature text blocks)
- **Placement**: Landing page hero section
- **Status**: 🔲 UI/UX component needs to be built in Astro/React
- **Action required**: Build the animated interactive carousel with the screenshots defined in the "UI Showcase" step.

### Contact Form
- Fields: Name, Company, Work Email, Message, preferred contact (Email / Phone)
- Submit → Resend email to `hallo@complens.de` + auto-reply to visitor
- CRM: creates HubSpot lead with `source = contact_form`
- Spam: hCaptcha (GDPR-compliant)
- Placement: `/kontakt` page + sticky "Fragen?" button on all landing pages

---

## Analytics & Tracking

### GA4 — ⚠️ Wired but not yet activated

The GA4 integration is already implemented in `apps/web/src/app/layout.tsx`:

```ts
// layout.tsx
const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
// ...
{gaId && <GoogleAnalytics gaId={gaId} />}
```

**To activate:** set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX` in `.env.local` and Vercel env vars.

### Key Conversion Events to Track (GA4)

```
landing_page_view
→ pricing_view
→ cta_click
→ trial_signup
→ first_upload
→ report_generated
→ payment_completed
```

These events need to be fired at the relevant points in the app. Use `gtag('event', ...)` calls or Google Tag Manager.

### Plausible Analytics (optional, cookie-free)
- GDPR-clean traffic view for the landing site
- Add `<script defer data-domain="complens.de" src="https://plausible.io/js/script.js">` to Astro layout
- Status: 🔲 not yet added

### Google Search Console
- Register `complens.de` and submit `sitemap.xml`
- Monitor keyword rankings for core EU pay transparency terms

---

## GDPR & Security

### Data Architecture
| Principle | Implementation |
|-----------|---------------|
| Data minimisation | Only fields needed for pay gap analysis stored |
| Purpose limitation | Disclosed in-app: "Data used exclusively for pay equity analysis" |
| Storage limitation | 3-year default retention (triennial reporting cycle) |
| Data subject rights | Admin can export or delete all employee records on demand |
| Pseudonymisation | Employee names replaceable with IDs before upload |
| Encryption at rest | Supabase AES-256 |
| Encryption in transit | TLS 1.3 |
| Data residency | AWS eu-central-1 (Frankfurt) — data never leaves the EU |

### AI & GDPR Transparency

| Question | Answer |
|----------|--------|
| When is AI called? | Only during import mapping — never during analysis |
| What goes to Gemini? | Column headers + max 5 anonymised sample cell values only |
| What is NOT sent? | Employee names, IDs, full salary records |
| Does Google retain it? | No — Gemini Enterprise API does not use API calls for training |
| Can user opt out? | Always — manual mapping available at every step |

### Sub-processors
Supabase (EU Frankfurt), Stripe (payments only), Resend (email only), Google Gemini (AI — explicit opt-in)

### Legal Documents Required Before Go-Live
| Document | Status |
|----------|--------|
| Impressum | ✅ Live at `/impressum` |
| Datenschutzerklärung | ✅ Live at `/datenschutz` |
| AGB | ✅ Live at `/agb` |
| AVV (DPA) | ✅ Auto-generated from org legal fields |
| TOMs document | 🔲 Needs final PDF |
| Cookie-Richtlinie | 🔲 Minimal (only Stripe cookies; Plausible = cookie-free) |
| Lawyer review (AGB + AVV) | 🔲 Budget ~€3,000–5,000 before go-live |

---

## Running Locally

```bash
# 1. Clone
git clone <repo>

# 2. Install
cd PayLens/apps/web
npm install

# 3. Environment
cp .env.local.example .env.local
# Fill in: SUPABASE_*, GEMINI_API_KEY, RESEND_API_KEY, STRIPE_*,
#           SUPERADMIN_EMAILS, NEXT_PUBLIC_GA_MEASUREMENT_ID

# 4. Run migrations
# Apply all 19 SQL files in /database/migrations/ via Supabase dashboard or CLI

# 5. Start dev server
npm run dev
# → http://localhost:3001

# 6. Superadmin panel
# → http://localhost:3001/superadmin
# Login with an email listed in SUPERADMIN_EMAILS
```

### Required Environment Variables

| Variable | Purpose |
|----------|---------| 
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-only) |
| `GEMINI_API_KEY` | Google Gemini 2.5 Pro |
| `RESEND_API_KEY` | Resend email service |
| `RESEND_FROM_EMAIL` | `hallo@complens.de` |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_LICENSE` | Stripe price ID for CompLens Lizenz |
| `STRIPE_PRICE_ADDITIONAL_ACCESS` | Stripe price ID for add-on seat |
| `SUPERADMIN_EMAILS` | Comma-separated list of superadmin emails |
| `NEXT_PUBLIC_APP_URL` | App base URL (`https://complens.de`) |
| `NEXT_PUBLIC_SITE_URL` | Same as above (used in invite links) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | GA4 Measurement ID (`G-XXXXXXXXXX`) — activates analytics |

> ⚠️ `ADMIN_SECRET` (old `?key=` auth) is **retired**. Remove from any existing `.env` files.

---

*Target go-live: **7 June 2026** — aligned with EU Directive 2023/970 transposition deadline.*
