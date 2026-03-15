# PayLens — Master Implementation Plan
### EU Pay Transparency SaaS — Commercial Product Blueprint
*Last updated: 2026-03-10*

---

## 1. Technical Architecture

### 1.1 Overview

PayLens runs as two parallel products sharing one core engine:

```
┌─────────────────────────────────────────────────────┐
│                  apps/shared/                        │
│   calculations/    ai-import/    types/              │
│   (pay gap math)   (col mapper)  (TypeScript types)  │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
      ┌────────▼────────┐    ┌────────▼────────┐
      │   apps/web/     │    │  apps/desktop/  │
      │  Next.js 14     │    │   Electron 32   │
      │  Supabase cloud │    │  SQLite local   │
      │  Gemini AI      │    │  Mistral AI     │
      │  Stripe billing │    │  Annual licence │
      └────────┬────────┘    └─────────────────┘
               │
      ┌────────▼────────┐
      │  landing/       │
      │  Astro static   │
      │  SEO-optimised  │
      └─────────────────┘
```

### 1.2 Stack Decisions

| Layer | Choice | Why |
|-------|--------|-----|
| Web framework | Next.js 14 (App Router) | SSR for SEO + React dashboard |
| Styling | Tailwind CSS | Fast iteration, desktop reuse |
| Database | Supabase (EU Frankfurt) | RLS, GDPR, familiar |
| Auth | Supabase Auth | Email, magic link, Google SSO |
| Billing | Stripe | Market standard, EU VAT, subscriptions |
| AI import (cloud) | Google Gemini 2.5 Pro | Column mapping + narratives |
| AI import (local) | Mistral via Ollama runtime | European AI, fully offline, no cloud |
| Desktop framework | Electron 32 + Vite | Reuse web components, macOS/Windows/Linux |
| Local DB (desktop) | SQLite via better-sqlite3 | Fast, embedded, no server |
| Landing | Astro 4 | Zero JS, best Lighthouse scores |
| Transactional email | Resend | Developer-friendly, EU infra |
| Analytics | Google Analytics 4 + Plausible | GA4 for conversion; Plausible for GDPR-clean |
| CRM | HubSpot (free → Growth) | Best-in-class, scales with revenue |
| Error tracking | Sentry (EU region) | Full-stack, EU data residency |

> **AI choice rationale:** Desktop uses **Mistral** — a French AI company, EU-headquartered, EU-funded. Message: *"A European AI, running locally on your machine. Not a byte leaves your premises."*

### 1.3 Desktop App — PC Requirements

| | Minimum | Recommended |
|--|---------|-------------|
| **OS** | Windows 10 (64-bit) / macOS 12 Monterey | Windows 11 / macOS 14 Sonoma |
| **CPU** | Intel Core i5 (8th gen) / AMD Ryzen 5 | Intel Core i7 / Apple M2 or better |
| **RAM** | 8 GB | 16 GB |
| **Storage** | 4 GB free (app + local DB) | 10 GB free |
| **RAM for Mistral AI** | 8 GB minimum (Mistral-7B) | 16 GB+ for faster inference |
| **GPU** | Not required | NVIDIA 6 GB VRAM significantly speeds up AI |
| **Internet** | Required for licence activation only | Not required after activation |

> AI column mapping on minimum spec takes ~30–60 seconds on CPU; under 5 seconds on Apple Silicon M2+. Manual column mapping is always available — no AI required to run pay gap analysis.

---

## 2. Authentication & User Management

### 2.1 Web SaaS Auth
- **Supabase Auth** handles all authentication
- Sign-up: email + password OR magic link (passwordless)
- Social login: Google (most common in German B2B)
- Multi-user access per organisation:
  - **Admin**: all features, billing, user management
  - **Analyst**: run analyses, view reports, no billing access
  - **Viewer**: read-only reports (for auditors / Betriebsrat)

### 2.2 Desktop App Auth
- Desktop users operate **fully offline** — no Supabase account required
- Licence validation: on first launch, validate annual licence key against a lightweight licence server (no payroll data sent — only device fingerprint + key)
- Licence key issued via Stripe + automated email (Resend) after purchase
- Offline grace period: 30 days without internet before re-validation required

### 2.3 Web ↔ Desktop Sync (Optional — Phase 3)
- Desktop generates a portable encrypted export file (`.paylens` format, AES-256)
- User may optionally upload this to their web account for cloud backup
- This is **opt-in only** and prominently disclosed in GDPR terms

---

## 3. Feature Roadmap

### Priority 1 — MVP (Go-Live, June 2026)

#### AI Import Wizard
- Drag-and-drop upload: CSV, XLSX, ODS
- Gemini (web) / Mistral (desktop) maps columns automatically:
  - Required: `name_or_id`, `gender`, `salary_base`, `employment_type`
  - Optional: `bonus`, `job_title`, `department`, `job_grade`, `hire_date`, `location`
- Confidence score shown per mapping; user corrects before confirming
- Handles messy real-world data: mixed languages, merged cells, missing headers
- Explicit opt-in prompt before any AI call: *"Möchten Sie KI zur automatischen Spaltenzuordnung verwenden? Es werden nur Spaltenköpfe und anonymisierte Beispielwerte übertragen."*
- Stores raw upload hash (SHA-256) for audit trail — **never the raw file**

#### Pay Gap Analysis Engine (`apps/shared/calculations/`)
- Unadjusted gap: mean and median, company-wide and by department / job group
- Adjusted gap: regression controls for WIFs (Wage Influencing Factors)
  - Standard WIFs: job grade, employment type (FT/PT), seniority, location
  - Custom WIFs: user-definable additional factors
- 5% threshold flag (EU Directive Article 9)
- Part-time vs full-time gap (Article 9 requirement)
- Quartile pay band distribution by gender (mean + median per quartile)
- Variable pay gap: mean and median separate from base salary

#### Reporting
- **EU Directive report**: machine-readable XML + human-readable PDF
- **German EntgTranspG format**: Entgeltstrukturanalyse and Auskunftsbericht
- **PowerPoint (PPT) report**: premium branded slide deck for board/management presentations
  - Auto-generated from analysis results — one click, ready to present
  - Slides: Executive Summary, Gap Overview, Department Drilldown, Quartile Distribution, Trend Chart, Remediation Priorities, Methodology Appendix
  - Branded template (customer logo + PayLens footer)
  - Uses `pptxgenjs` library — runs entirely server-side, no external service
  - Available on all paid plans; PPT export locked during 7-day trial
- Multi-year comparison (required for triennial reporting)
- Report generation in DE and EN
- Auditor-ready appendix with full methodology description

#### Dashboard
- Summary KPIs: overall gap, adjusted gap, departments at risk
- Traffic-light status per department (green < 3%, amber 3–5%, red > 5%)
- Trend chart over reporting periods

#### Onboarding Module (First-Time User Experience)
- Triggered automatically on first login — cannot be skipped until Step 3 completed
- **Step 1 — Welcome tour**: 5-slide interactive product walkthrough (what PayLens does, what data is needed, what you get at the end)
- **Step 2 — Data upload**: guided upload wizard with annotated example file download; inline tips at each field
- **Step 3 — First analysis**: one-click run with pre-set defaults; result explained with plain-language annotation
- **Step 4 — Report preview**: show the generated PDF/PPT summary; prompt to upgrade if on trial
- Progress bar visible throughout: "Step 2 of 4 — Import your data"
- Onboarding can be replayed at any time from the Help menu
- Separate onboarding flow for Desktop (simpler — no auth, jump straight to data upload)
- Completion tracked in Supabase → triggers D0 welcome email and HubSpot onboarding task

### Priority 2 — Enhancement (Q3/Q4 2026)

#### Remediation Planner
- Identify employees below pay equity benchmark
- Scenario modelling: "Close gap by X% = €Y annual cost"
- Priority ranking: most cost-effective adjustments first
- Export remediation plan as Excel for board/HR review

#### Right to Information Portal (Article 7)
- Employee self-service portal (separate subdomain: `info.paylens.de`)
- Employee enters name + employee ID to access their pay category reference data
- HR dashboard shows all RtI requests with status
- Auto-generate written response letter (Word / PDF) in statutory format
- Available on **PayLens AI** plan only

#### Job Architecture Module
- Define job families, levels, grades
- Set pay band min / mid / max per grade
- Compa-ratio distribution by gender per grade
- Salary range checker: flag outliers above/below band

### Priority 3 — Scale (2027)

- Multi-jurisdiction: Austria (§ GlBG), Switzerland (Logib integration)
- API for HRIS integrations (Personio, SAP SuccessFactors, Workday)
- Enterprise SSO (SAML, SCIM provisioning)
- Desktop → Web sync (encrypted portable format)
- White-label partner programme

---

## 4. Security & GDPR Compliance

### 4.1 Data Architecture for GDPR

| Principle | Implementation |
|-----------|---------------|
| Data minimisation | Only fields needed for pay gap analysis are stored; employee names are optional and replaceable with IDs |
| Purpose limitation | In-app disclosure: "Data is used exclusively for pay equity analysis" |
| Storage limitation | Data retention configurable per org (default: 3 years for triennial reporting) |
| Data subject rights | Admin can export or delete all employee records on demand |
| Pseudonymisation | Option to replace names with employee IDs before upload |
| Encryption at rest | Supabase AES-256 encryption |
| Encryption in transit | TLS 1.3 everywhere |
| Breach notification | Customer notified within 72h (GDPR Article 33) |

### 4.2 Server Infrastructure
- **Supabase region: EU (Frankfurt, AWS eu-central-1)** — data never leaves the EU
- No third-party analytics with EU data leakage (no Hotjar, no FullStory)
- Plausible Analytics: EU-hosted, no cookies, no personal data

### 4.3 Row-Level Security
- Each organisation has a `tenant_id`
- All Supabase queries enforced via RLS: users only see their own org's data
- Analyst role cannot export raw employee records (aggregated results only)
- Viewer role: read-only, no export

### 4.4 GDPR Technical Compliance Documentation

> Clients receive a downloadable **GDPR Technical Compliance Package** — handed directly to their Datenschutzbeauftragter or auditor. Created internally, no legal consultant required.

**Document: "PayLens — Technische und organisatorische Maßnahmen (TOMs)"** (GDPR Art. 32)

| Category | Measure |
|----------|---------|
| **Access control** | Role-based access (Admin / Analyst / Viewer); Supabase RLS enforced at DB level; MFA available |
| **Encryption in transit** | TLS 1.3 for all HTTPS connections |
| **Encryption at rest** | AES-256 for all data stored in Supabase (AWS eu-central-1) |
| **Pseudonymisation** | Users may replace employee names with IDs before upload; PayLens never requires real names |
| **Data minimisation** | Only fields required for pay gap calculations are accepted and stored |
| **Data residency** | All data stored exclusively in AWS eu-central-1 (Frankfurt, Germany) |
| **Sub-processors** | Supabase (storage, EU), Stripe (payments only), Resend (email only), Google Gemini (AI — PayLens AI plan only, explicit opt-in) |
| **Data subject rights** | Admin can export or delete all employee records on demand |
| **Retention policy** | Configurable per org (default: 3 years); automated deletion on account termination |
| **Breach notification** | Internal detection via Sentry; customer notified within 72h (Art. 33) |
| **Penetration testing** | Annual third-party pen test |
| **Incident log** | Internal security incident log maintained |
| **Desktop mode** | Employee data never transmitted; only licence fingerprint sent for activation |
| **AI data handling** | Gemini API only called on PayLens AI plan with explicit opt-in; only column headers + ≤5 anonymised sample cell values sent — never full names, IDs, or complete records; Google does not use API data for model training |

### 4.5 AI GDPR Transparency — What Goes to AI

This is published in-app and in the TOMs document:

| Question | Answer |
|----------|--------|
| When is AI called? | Only during the import mapping wizard — never during analysis |
| What is sent to Gemini? | Column headers (e.g. "Abteilung", "Gehalt") + max 5 anonymised cell samples (e.g. "48500", "F") |
| What is NOT sent? | Full salary data, employee names, IDs, or complete records |
| Does Google store it? | No — Gemini Enterprise API does not use API calls to train models; data not retained after response |
| Legal basis | No personal data in the legal sense is transmitted (Art. 4 GDPR); headers and sample statistics are not personal data |
| Can the user opt out? | Always — manual column mapping is available at every step |

### 4.6 Legal Instruments Required

| Document | Language | Notes |
|----------|----------|-------|
| Impressum | DE (mandatory) | §5 TMG: company name, address, register, Verantwortlicher |
| Datenschutzerklärung (Privacy Policy) | DE + EN | GDPR Art. 13/14: what data, why, how long, rights |
| AGB (Terms & Conditions) | DE + EN | Governs subscription use, liability, cancellation |
| AVV (Auftragsverarbeitungsvertrag / DPA) | DE + EN | GDPR Art. 28: required for all B2B customers |
| TOMs (Technical & Org. Measures) | DE + EN | Standalone compliance doc for auditors — created by us |
| Cookie-Richtlinie | DE + EN | Minimal (Plausible = cookie-free; only Stripe cookies) |
| EULA (Desktop) | DE + EN | Licence scope, no resale, annual renewal |
| Subscription Agreement | DE + EN | Embedded in Stripe checkout: payment terms, auto-renewal, cancellation |
| Widerrufsbelehrung | DE (mandatory) | 14-day cancellation right (waivable for B2B SaaS) |

> Budget ~€3,000–5,000 for a German IT/data protection lawyer to review AVV and AGB before go-live.

**Key AGB clauses:**
- SaaS availability SLA (99.5% uptime)
- Data ownership: customer owns their data, we process it
- Limitation of liability: cap at 12 months of subscription fees
- Governing law: German law, jurisdiction: German courts

**Key AVV clauses:**
- Sub-processors listed in Annex: Supabase (EU), Stripe, Resend, Google (AI plan only)
- Data deletion: within 30 days of contract termination

### 4.7 Desktop App — GDPR Advantage
- Employee payroll data **never leaves the local machine**
- Explicitly marketed: *"Kein Upload. Keine Cloud. Volle Kontrolle."*
- Licence validation transmits only: licence key + anonymous device fingerprint
- Primary market: regulated industries — Öffentlicher Dienst, banking, healthcare, large manufacturers

---

## 5. Payments & Subscriptions (Stripe)

### 5.1 Pricing — Three Products Only

**Competitor research (March 2026):**

| Competitor | Model | Price Range |
|-----------|-------|-------------|
| **Figures HR** | Annual SaaS | €1,700 – €7,300/yr (avg €4,300) |
| **Sysarb** | Annual, custom by headcount | Estimated €5,000 – €20,000/yr |
| **Syndio** | Enterprise | Estimated €20,000 – €80,000/yr |
| **beqom** | Enterprise module | CHF 50,000/yr starting |
| **HR consultant (manual audit)** | Project-based | €15,000 – €25,000/yr |
| **Swedish pay audit benchmark** | Per employee | €500/employee/yr for manual work |

**Conclusion:** Market tolerates €2,500–€8,000/yr for focused SaaS tools. Pricing reflects the value of replacing €15,000+ consultant spend.

```
┌──────────────────────────────────────────────────────────┐
│  PRODUCT          PRICE/YR     AI                        │
├──────────────────────────────────────────────────────────┤
│  PayLens          €4,490       No AI — 100% manual       │
│                               Data stays in EU cloud     │
│                                                          │
│  PayLens AI       €4,990       Cloud AI (Gemini):        │
│                               column mapping, narratives,│
│                               remediation AI             │
│                                                          │
│  PayLens Desktop  €3,490       Local AI (Mistral):       │
│                   per licence  fully offline, no cloud   │
└──────────────────────────────────────────────────────────┘
```

**PayLens / PayLens AI**: Base licence = 1 user. Additional users: €699/yr per seat.

**PayLens Desktop**: Sold per licence (= per machine / per named user). No team add-ons. Customers needing more than 3 licences should contact us for volume pricing.

**Optional per-employee add-on**: €8/employee/yr (minimum €500) for large employers who prefer headcount-based pricing — well below the €500/employee manual audit benchmark.

> **Positioning:** At €4,490–€4,990/yr we are substantially below Figures (€4,300 avg) and Sysarb. An HR director replacing a €15,000 consultant project with PayLens AI at €4,990 sees a 70% cost saving.

> **Trust message shown to all users:** *"Egal welchen Plan Sie wählen: Ihre Gehaltsanalyse verlässt nie unsere EU-Server. AI-Funktionen sind optional und werden nur auf ausdrücklichen Wunsch aktiviert."*

### 5.2 Feature Matrix

| Feature | PayLens | PayLens AI | PayLens Desktop |
|---------|---------|------------|-----------------|
| Unlimited employees | ✅ | ✅ | ✅ |
| Unadjusted pay gap | ✅ | ✅ | ✅ |
| Adjusted pay gap (WIFs) | ✅ | ✅ | ✅ |
| Remediation planner | ✅ | ✅ | ✅ |
| Multi-year trend analysis | ✅ | ✅ | ✅ |
| EU + German reports (PDF) | ✅ | ✅ | ✅ |
| AVV / TOMs compliance docs | ✅ | ✅ | ✅ |
| Manual column mapping | ✅ | ✅ | ✅ |
| AI column mapping | ❌ | ✅ Cloud (Gemini) | ✅ Local (Mistral) |
| AI narrative report generator | ❌ | ✅ | ✅ |
| AI remediation suggestions | ❌ | ✅ | ✅ |
| Right to Information portal (Art. 7) | ❌ | ✅ | ❌ |
| In-app AI support assistant | ❌ | ✅ | ✅ Local |
| Data stays fully local | ❌ (EU cloud) | ❌ (EU cloud) | ✅ |
| Base users | 1 | 1 | 1 per licence |
| Additional users | +€699/yr each | +€699/yr each | N/A (per licence) |

### 5.3 Trial & Conversion Strategy
- **7-day free trial** — full product access (PayLens AI), no credit card required
- **During trial: exports, PDF downloads, and data extraction are disabled** — analysis is visible but not extractable, preventing abuse of the trial as a free one-off analysis tool
- Reminder sequence: D-3 and D-1 before trial end
- Permanent free Light tier: upload up to 10 employees, view headline gap only — no export, ever

### 5.4 Feature Gating
- `subscription_tier` stored in Supabase `organisations` table
- Supabase Edge Functions validate tier on sensitive operations server-side
- Next.js middleware guards protected routes
- In-app upgrade prompts at limit boundaries

### 5.5 Payment Methods
- **Stripe Checkout**: credit card, SEPA Direct Debit — primary online flow
- **Bank transfer (Vorkasse)**: PDF invoice emailed to customer; subscription activated on payment confirmation. Essential for German B2B where company credit cards are uncommon.
  - Invoice payment term: 14 days
  - Automated reminder at D+7 if unpaid
  - Access suspended at D+21 if still unpaid (3-day warning first)
- Annual invoices issued automatically at renewal

### 5.6 Desktop Licensing & Renewal
- Customer pays €3,490/yr via Stripe Checkout or bank transfer
- Stripe webhook triggers licence key generation + delivery via Resend
- Licence validated locally on startup: only device fingerprint + key sent (no payroll data)
- **Renewal reminder sequence**: D-30, D-14, D-7 before expiry
- At expiry: read-only mode (existing analyses visible, no new import or reports)
- Renewal within 14-day payment term for Vorkasse customers

---

## 6. CRM & Customer Lifecycle

### 6.1 Tool: HubSpot

**Start**: HubSpot Free CRM (€0, unlimited contacts, deals, pipeline)
**Scale to**: HubSpot Starter (~€20/mo) → Marketing Hub Professional (~€792/mo)

**What HubSpot manages:**
- Lead capture from landing page forms
- Trial signup → qualified lead pipeline
- Customer onboarding tasks and follow-up sequences
- Churn detection: track login frequency and usage signals from Supabase webhooks
- Renewal reminders and expansion upsell

### 6.2 Customer Journey Stages

```
Visitor → Lead → Trial → Customer → Retained → Expanded → Advocate
```

| Stage | Trigger | Action |
|-------|---------|--------|
| Lead | Contact form / content download | Nurture sequence (3 emails, 2 weeks) |
| Trial start | Supabase signup webhook | Onboarding email D0, D3, D7 |
| Trial → customer | Stripe payment | Welcome call offer + success email |
| At-risk | No login in 14 days | Automated check-in email |
| Renewal | 30/7 days before renewal | Reminder + upgrade offer |
| Expansion | Adds users | In-app seat add prompt + HubSpot task |
| Advocate | Long-tenure customer | Request testimonial / case study |

### 6.3 Support
- **Phase 1**: Email support via support@paylens.de (HubSpot shared inbox)
- **Phase 2**: Intercom in-app chat (~€74/mo) when customer base warrants
- **Knowledge base**: Published at `help.paylens.de` — self-service, also SEO asset

---

## 7. Marketing Stack

### 7.1 Analytics

| Tool | Purpose | Cost |
|------|---------|------|
| **Google Analytics 4** | Funnel tracking, conversion events, ad attribution | Free |
| **Plausible Analytics** | Cookie-free GDPR-compliant traffic stats | €9/mo |
| **Google Search Console** | Keyword rankings, crawl health, CTR | Free |
| **Stripe Dashboard** | MRR, churn, LTV, revenue analytics | Free |
| **HubSpot** | Lead-to-customer conversion, pipeline | Free → paid |

### 7.2 Conversion Tracking (GA4)
Key funnel events:
`landing_page_view` → `pricing_view` → `cta_click` → `trial_signup` → `first_upload` → `report_generated` → `payment_completed`

Google Tag Manager for clean event management without code changes.

### 7.3 Paid Acquisition

**Google Ads — German keywords (€2,000–5,000/mo):**
- `Entgelttransparenzgesetz Software` — HIGH intent, low competition
- `Gender Pay Gap berechnen Tool` — informational + product intent
- `EU Entgelttransparenzrichtlinie Umsetzung` — compliance buyers
- `Lohngleichheit Analyse` — HR managers
- `Trusaic Alternative`, `Haufe Entgelttransparenz Alternative` — competitor terms

**LinkedIn Ads (Phase 2, €1,500/mo):**
- Target: HR Directors, Compensation Managers, CFOs — DACH only
- Thought leadership around the June 2026 deadline

### 7.4 SEO — State of the Art

#### Technical SEO (Astro Landing Site)
- Perfect Lighthouse scores (100/100 Performance, Accessibility, Best Practices)
- `sitemap.xml` + `robots.txt` auto-generated
- Canonical tags, hreflang (`de`, `en`) on all pages
- Structured data: `SoftwareApplication`, `FAQPage`, `Product` (Schema.org)
- Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1

#### Content SEO (Pillar + Cluster Strategy)

Benchmarked against Ravio's comprehensive EU Pay Transparency guide (ravio.com), we will publish equivalent or superior content in German-first:

```
Pillar: EU Entgelttransparenzrichtlinie — Der vollständige Leitfaden (DE/EN)
├── Was ist die EU-Entgelttransparenzrichtlinie?
├── Wer ist betroffen? (Unternehmen ab 100 MA)
├── Was ist der Gender Pay Gap? (bereinigt vs. unbereinigt)
├── Was muss im Bericht enthalten sein? (Mittelwert, Median, Quartile)
├── Was ist eine gemeinsame Entgeltbewertung? (5%-Schwelle)
├── Auskunftsrecht der Mitarbeitenden (Art. 7)
├── Wie bereite ich mein Unternehmen vor?
├── WIF — Wage Influencing Factors erklärt
├── EU-Richtlinie vs. deutsches EntgTranspG — Was ändert sich?
├── Berichtspflichten nach Unternehmensgröße (>250, 100–249, <100)
├── Beweislastumkehr — was bedeutet das für Arbeitgeber?
├── Gehaltsbänder und Entgelttransparenz bei Stellenausschreibungen
└── [Vergleich] PayLens vs. Trusaic vs. Haufe
```

- Launch: 1 high-quality article per month starting April 2026
- Pillar page: 4,000–5,000 words; cluster articles: 1,000–1,500 words
- Backlink strategy: HR press (Personalwirtschaft, HR-Themen.de), LinkedIn

#### Local/DACH SEO
- `paylens.de` primary domain (`.de` = trust signal)
- Google Business Profile registered as German tech company
- Content always DE-first, EN as secondary

### 7.5 Landing Page — UI Showcase (Replaces Demo Booking)

Instead of a "Book a Demo" flow (high friction, time-consuming), the landing page provides a **self-serve product tour** that communicates exactly how PayLens works — no meeting required.

#### UI Showcase Design
- **Annotated screenshot carousel**: 6–8 high-quality screenshots of actual product screens, each with a numbered annotation explaining the key feature shown
  1. Dashboard — overall pay gap KPIs + traffic-light department status
  2. Import wizard — AI column mapping with confidence scores
  3. Adjusted pay gap analysis — WIF breakdown
  4. Quartile distribution chart
  5. Remediation planner — scenario modelling
  6. PDF/PPT report preview
- **Interactive demo mode** (Phase 2): embedded read-only version of the dashboard, pre-loaded with anonymised synthetic data (100 employees), so visitors can click around the real UI before signing up
- **"How it works" section**: 3-step illustrated flow — *Upload your data → Run the analysis → Download your compliance report* — with short animated illustrations per step
- **Video walkthrough** (90 seconds): screen recording of the full workflow from CSV upload to PPT download — embedded directly on the page, autoplay muted, no YouTube (privacy)

#### Contact Form
- Short form: Name, Company, Work Email, Question / Use Case (free text), preferred contact method (Email / Phone)
- On submit: sends email directly to `hallo@paylens.de` via **Resend** (no third-party form service needed)
  - Email template includes all form fields formatted cleanly for quick response
  - Auto-reply sent to the visitor confirming receipt: *"Vielen Dank — wir melden uns innerhalb von 24 Stunden bei Ihnen."*
- Simultaneously creates a lead contact in HubSpot CRM with `source = contact_form`
- Captcha: hCaptcha (GDPR-compliant alternative to reCAPTCHA) to prevent spam
- Placement: dedicated `/kontakt` page + sticky "Fragen?" button visible on all landing pages

---

## 8. Legal & Compliance Documents

### 8.1 Required Before Go-Live

| Document | Language | Notes |
|----------|----------|-------|
| Impressum | DE (mandatory) | §5 TMG: company name, address, register, Verantwortlicher |
| Datenschutzerklärung (Privacy Policy) | DE + EN | GDPR Art. 13/14: what data, why, how long, rights |
| AGB (Terms & Conditions) | DE + EN | Governs subscription use, liability, cancellation |
| AVV (Auftragsverarbeitungsvertrag / DPA) | DE + EN | GDPR Art. 28: required for all B2B data processing customers |
| TOMs (Technical & Org. Measures) | DE + EN | Standalone compliance doc for auditors — created internally |
| Cookie-Richtlinie | DE + EN | Minimal (Plausible = cookie-free; only Stripe cookies) |
| EULA (Desktop) | DE + EN | Licence scope, no resale, annual renewal |
| Subscription Agreement | DE + EN | Stripe-linked: payment terms, auto-renewal, cancellation |
| Widerrufsbelehrung | DE (mandatory) | 14-day cancellation right (waivable for B2B SaaS) |

### 8.2 Key Legal Clauses

**AGB must cover:**
- SaaS availability SLA (99.5% uptime)
- Data ownership: customer owns their data, we process it
- Acceptable use policy (no manipulation of payroll data)
- Limitation of liability: cap at 12 months of subscription fees
- Governing law: German law, jurisdiction: German courts

**AVV must cover:**
- Sub-processors: Supabase (EU Frankfurt), Stripe (payments), Resend (email), Google Gemini (PayLens AI plan only)
- Data subject rights: customer is controller, PayLens is processor
- Data deletion: within 30 days of contract termination

**Subscription Agreement:**
- Auto-renewal disclosure (prominent)
- Cancellation: 30 days notice or end of billing period
- Price changes: 30-day notice before renewal
- No refunds on annual plans (except statutory rights)

### 8.3 User Manual & In-App AI Support

**A comprehensive manual is required** — trust builder, support reducer, and strong SEO asset.

#### Manual Format
- **In-app contextual help**: Every module has a ❓ icon opening a step-by-step side panel
- **Full knowledge base**: Published at `help.paylens.de` (HubSpot KB or Mintlify)
- **PDF download**: "PayLens Handbuch" (DE) — for auditors and Betriebsrat
- **Video walkthroughs**: Short recordings for each key workflow

#### Manual Structure
```
1. Erste Schritte / Getting Started
   1.1 Konto erstellen und verifizieren
   1.2 Daten importieren (KI-Assistent + manuell)
   1.3 Erste Analyse ausführen

2. Datenimport
   2.1 Unterstützte Dateiformate (CSV, XLSX, ODS)
   2.2 KI-gestützte Spaltenzuordnung (PayLens AI)
   2.3 Manuelle Zuordnung
   2.4 Validierung und Fehlerbehandlung
   2.5 Datenschutz beim Import — was geht zur KI?

3. Entgeltlückenanalyse
   3.1 Unbereinigter Gender Pay Gap
   3.2 Bereinigter Gender Pay Gap (WIF-Modell)
   3.3 Entgeltquartile und Banding
   3.4 Variable Vergütung
   3.5 Abteilungs- und Standortdrilldown

4. Berichterstattung
   4.1 EU-Richtlinie 2023/970 — konformer Bericht
   4.2 Entgelttransparenzgesetz-Format (Deutschland)
   4.3 Mehrjahreszeitreihe
   4.4 Export und Audit-Anhang

5. Abhilfeplanung
   5.1 Szenarienrechner
   5.2 Priorisierungsliste
   5.3 Budgetauswirkung

6. Auskunftsrecht-Portal (Art. 7) — PayLens AI only
   6.1 Portal aktivieren
   6.2 Anfragen bearbeiten
   6.3 Antwortbriefe generieren

7. Benutzerverwaltung
   7.1 Rollen und Berechtigungen (Admin / Analyst / Viewer)
   7.2 Weitere Nutzer einladen (+€699/Jahr)

8. Datenschutz und Sicherheit
   8.1 TOMs-Dokument herunterladen
   8.2 AVV herunterladen
   8.3 Daten exportieren und Konto schließen

9. Desktop-Version (PayLens Desktop)
   9.1 Installation und Aktivierung
   9.2 Offline-Betrieb (Mistral AI lokal)
   9.3 Lizenzverlängerung
```

#### In-App AI Support Assistant (All Paid Plans)
- **"Fragen Sie PayLens"** — persistent chat widget visible on every screen (bottom-right)
- Architecture: RAG (Retrieval-Augmented Generation) over indexed knowledge base
  - Knowledge base sources: product manual (all 9 chapters), EU Directive 2023/970 full text, German EntgTranspG, all FAQ content, GDPR / TOMs documentation
  - Web: Gemini 2.5 Pro as model; Supabase pgvector for embeddings storage
  - Desktop: Mistral-7B local model via Ollama — answers fully offline, zero data transmitted
- Understands context: if user is on the Dashboard screen, it knows what KPIs are displayed and can explain them directly
- Can answer:
  - *"Was bedeutet der bereinigte Gender Pay Gap in meinem Ergebnis?"*
  - *"Welche WIFs sollte ich für ein Unternehmen in der Produktion angeben?"*
  - *"Muss ich als Unternehmen mit 180 Mitarbeitern jährlich oder alle 3 Jahre berichten?"*
  - *"Wie lade ich meinen Bericht als PPT herunter?"*
  - *"Was passiert, wenn mein Pay Gap über 5% liegt?"*
- Escalation: if the assistant cannot answer with confidence, it offers *"Soll ich ein Support-Ticket erstellen?"* → creates ticket in HubSpot automatically
- Shows sources: every answer includes a clickable footnote linking to the relevant manual section or EU Directive article
- Voice-accessible: keyboard shortcut `Cmd/Ctrl + K` opens the assistant from anywhere
- **Landing page version**: a public-facing, read-only version (no product context — only compliance knowledge) to answer visitor questions and convert to trial sign-ups

> Implementation: embed vector index of all documents at build time; update index automatically when manual or FAQ content changes.

---

## 9. SaaS Content Hub — EU Pay Transparency Knowledge Base

Benchmarked against [Ravio's comprehensive EU Pay Transparency guide](https://ravio.com/blog/everything-you-need-to-know-about-the-eu-pay-transparency-directive), we publish equivalent authoritative content in German-first, giving German-speaking HR leaders their best native resource for the Directive.

### 9.1 What to Cover (Ravio Benchmark Analysis)

Ravio's page covers three parts: (1) FAQs, (2) legislation summary chapter by chapter, (3) country transposition tracker. We match this structure and go further with German-specific content.

### 9.2 FAQ Content — Our Version

| Question | Our Answer (summary) |
|----------|---------------------|
| Was ist die EU-Entgelttransparenzrichtlinie? | New EU legislation (2023/970/EU) requiring all EU employers to increase pay transparency and address the gender pay gap. Transposition deadline: 7 June 2026. |
| Wer ist betroffen? | All public and private sector employers in the EU. Staggered rollout: ≥150 employees first report June 2027 (for 2026 data); <150 employees first report June 2031 (for 2030 data). Annual reporting for >250 employees; every 3 years for 100–249 employees. |
| Was muss berichtet werden? | Mean and median pay gap for base salary; proportion of men/women receiving variable pay; mean and median gap for variable pay; proportion of men/women in each pay quartile. |
| Was ist die 5%-Schwelle? | If a company's gender pay gap exceeds 5% and cannot be objectively justified, a joint pay assessment (gemeinsame Entgeltbewertung) in cooperation with employee representatives is mandatory (Article 9). |
| Was ist der Unterschied zwischen bereinigtem und unbereinigtem Pay Gap? | Unadjusted: raw difference in median pay between men and women. Adjusted: controls for Wage Influencing Factors (job grade, employment type, location, seniority) — the like-for-like comparison. Both are required under the Directive. |
| Was ist das Auskunftsrecht? | Employees may request information about their individual pay level and average pay of colleagues performing equal work or work of equal value, broken down by gender (Article 7). |
| Was bedeutet Beweislastumkehr? | In pay discrimination cases, the employer must prove discrimination did NOT take place — not the employee. This reverses the existing burden of proof (Article 18). |
| Was gilt für Stellenausschreibungen? | Employers must disclose a salary range to candidates before interviews. They are banned from asking about salary history (Article 5). |
| Wie bereite ich mein Unternehmen vor? | 1. Establish job architecture (grades, levels). 2. Run a pay gap analysis now — find where you stand. 3. Document Wage Influencing Factors. 4. Prepare your first report. 5. Set up an employee RtI process. |

### 9.3 Legislation Summary (Chapter by Chapter)

**Chapter 1 — Purpose, Scope, Key Concepts**
- Art. 1: Purpose — strengthen equal pay through transparency
- Art. 2: Scope — all employers, all workers with employment relationship
- Art. 3: 'Pay' includes base salary + all cash/non-cash compensation from employer
- Art. 4: Member states must provide tools to assess 'work of equal value'

**Chapter 2 — Pay Transparency Rules**
- Art. 5: Salary transparency for job applicants (range disclosure, no history questions)
- Art. 7: Employee right to request pay reference data
- Art. 9: Gender pay gap reporting; 5% threshold triggers joint assessment

**Chapter 3 — Enforcement & Penalties**
- Art. 14: Official court procedures for equal pay enforcement
- Art. 16: Compensation for discrimination including back pay and moral damage
- Art. 18: Burden of proof shifts to employer
- Art. 23: 'Effective, proportionate and dissuasive' penalties for non-compliance

**Chapter 4 — Horizontal Provisions**
- Art. 27: Member states may go beyond the Directive in favour of workers
- Art. 29: Each member state must establish a monitoring body
- Art. 34: Transposition deadline — 7 June 2026

### 9.4 Germany-Specific Implementation

Germany currently has the EntgTranspG (Entgelttransparenzgesetz, 2017), which requires companies with 500+ employees to report. The EU Directive expands this significantly:

| | Current (EntgTranspG) | New (EU Directive) |
|-|----------------------|--------------------|
| Reporting threshold | 500+ employees | 100+ employees |
| Reporting frequency | Every 3 years | Annually (>250); every 3 years (100–249) |
| Employee rights | Individual pay info on request | Extended RtI with comparison group pay data |
| Burden of proof | Employee must prove discrimination | Employer must disprove |
| Salary in job ads | Not required | Mandatory |

Status as of March 2026: Germany has a draft proposal in progress. Full national law must be in force by 7 June 2026.

### 9.5 Publishing Plan for Content Hub

| Content Type | Format | Timeline |
|-------------|--------|---------|
| Pillar: Der vollständige Leitfaden | 4,500 words | April 2026 |
| FAQ hub page | Structured FAQ + Schema.org | April 2026 |
| Kapitel-für-Kapitel Gesetzesübersicht | 2,500 words | April 2026 |
| Country tracker: Germany focus | Live update page | May 2026 |
| Interactive: Berichtspflicht-Checker | Web tool (are you affected?) | May 2026 |
| Monthly blog updates | 800–1,200 words each | Monthly |

---

## 10. Development Phases & Timeline

### Phase 0 — Foundation (March–April 2026)
- [ ] Next.js 14 scaffold + Supabase setup (EU Frankfurt)
- [ ] Astro landing scaffold + Impressum / Privacy DE
- [ ] Domain + email (paylens.de, hallo@paylens.de)
- [ ] Stripe products and pricing configured (PayLens, PayLens AI, Desktop)
- [ ] Auth pages (sign up, log in, email verify)
- [ ] HubSpot CRM account + landing page form connected

### Phase 1 — Core Product (April–May 2026)
- [ ] AI import wizard (Gemini for web; Mistral for desktop)
- [ ] Pay gap calculation engine (shared module)
- [ ] Dashboard shell with KPIs + traffic-light status
- [ ] EU/German report generation (PDF + XML)
- [ ] Subscription checkout + plan gating (PayLens vs PayLens AI)
- [ ] AI GDPR transparency prompt in import flow

### Phase 2 — Beta (May 2026)
- [ ] 10 beta customers onboarded (free, in exchange for feedback)
- [ ] Onboarding email sequence live (D0, D3, D7)
- [ ] Plausible + GA4 tracking live
- [ ] Landing page with pillar article + 2 cluster articles published
- [ ] Legal documents finalised (AVV + AGB lawyer-reviewed)
- [ ] In-app AI support assistant (RAG on manual + EU directive)

### Phase 3 — Go-Live (June 7, 2026)
- [ ] Public launch — aligned with EU Directive transposition deadline
- [ ] Google Ads campaign activated (Entgelttransparenz keywords)
- [ ] Press release to Personalwirtschaft, HR-Themen.de
- [ ] PayLens Desktop (Windows + macOS) released with Mistral AI
- [ ] Country tracker page live

### Phase 4 — Scale (H2 2026 → 2027)
- [ ] Remediation planner
- [ ] Right to Information portal (PayLens AI)
- [ ] Partner/reseller programme
- [ ] Austria + Switzerland market entry
- [ ] HRIS API integrations (Personio, SAP SuccessFactors)
- [ ] HubSpot upgrade to Marketing Hub for advanced automation

---

## 11. Budget Estimate (Year 1)

| Category | Monthly | Annual |
|----------|---------|--------|
| Supabase (Pro, EU) | €25 | €300 |
| Stripe fees | 1.5% + €0.25/txn | variable |
| Gemini AI API | ~€50–200 | €600–2,400 |
| Resend (email) | €0–20 | €0–240 |
| Plausible | €9 | €108 |
| HubSpot Starter | €20 | €240 |
| Sentry | €26 | €312 |
| Google Ads | €2,000–5,000 | €24,000–60,000 |
| Legal (one-time) | — | €3,000–5,000 |
| Domain + SSL | — | €50/yr |
| **Total (excl. ads)** | **~€330** | **~€4,000** |

**Break-even:** 1 PayLens customer covers ~13 months of infrastructure. 1 PayLens AI customer covers ~15 months.
Revenue to cover Google Ads at €2,000/mo: ~6 PayLens or 5 PayLens AI customers.
