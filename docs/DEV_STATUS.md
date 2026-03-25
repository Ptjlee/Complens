# CompLens — Development Status
*Last updated: 2026-03-25 23:20 CET*

---

## Current State: Phase 3 — Feature Complete ✅

### Dev Server
- Next.js 16 (Turbopack) on **http://localhost:3001**
- Start: `cd /Users/peter/Documents/DexterBee/PayLens/apps/web && npm run dev`

---

## ✅ Completed — Phase 2

All core product features are live.

| Area | Status |
|------|--------|
| Auth flow (login, signup, email confirm, org provisioning) | ✅ |
| Dashboard shell (sidebar, header, KPI cards) | ✅ |
| Import module (CSV/Excel upload, AI column mapping, validation) | ✅ |
| Pay gap engine (unadjusted, WIF-adjusted, residual; median + mean) | ✅ |
| Explanations (Art. 10 per-employee justification, multi-category) | ✅ |
| Pay overrides (manual salary corrections before analysis) | ✅ |
| Remediation planner (Art. 11 action plans + step tracking) | ✅ |
| Reports — Interactive viewer | ✅ |
| Reports — PDF export with MUSTER watermark + content lock (trial/expired) | ✅ |
| Reports — PPT export with MUSTER watermark + content lock (trial/expired) | ✅ |
| Employee portal (Art. 7 right-to-info lookup + PDF letter) | ✅ |
| Trial banner + countdown | ✅ |
| Trial expired overlay (full-screen, Stripe CTA) | ✅ |
| Stripe checkout (subscription) | ✅ |
| Stripe webhook → license activation | ✅ |
| Team invitations (email, join page, name + function on join) | ✅ |
| Settings (org, team, plan/billing display, security) | ✅ |
| AI chatbot (Gemini 2.5 Pro, floating panel, all pages) | ✅ |
| Onboarding modal (5-step guided flow) | ✅ |
| Superadmin panel (user list, stats, license actions, bulk email, AI org analysis) | ✅ |

---

## ✅ Completed — Phase 3

| Feature | Notes |
|---------|-------|
| **Superadmin email-allowlist auth** | `SUPERADMIN_EMAILS` env var; `superadminAuth.ts` used by all 7 action routes. Old `?key=` / `ADMIN_SECRET` retired. |
| **Support ticket system** | Migration 019; `support_tickets` table with RLS. Users submit via `/dashboard/help`. |
| **AI ticket triage** | On ticket creation, Gemini classifies category, priority, writes one-line summary + draft reply |
| **Superadmin Support tab** | Full ticket management UI: KPI row, status/priority/search filters, multi-turn thread view, AI draft loading, polish button |
| **AI reply polish** | `/api/support/ai-polish-reply` — admin can refine draft before sending, bilingual (DE / EN toggle) |
| **Support email delivery** | Admin reply in Support tab fires Resend email to user with branded HTML template. Fire-and-forget after DB update. |
| **Internationalisation (DE/EN)** | `LanguageContext` + `translations.ts`; preference stored in `organisation_members.preferred_language` (migration 017) |
| **Contract generation** | `/api/contracts/avv` + `/api/contracts/license` — auto-generated from org legal fields |
| **Org legal fields** | Migration 018 — `legal_representative`, `legal_address`, `legal_city`, `legal_zip`, `vat_id` on `organisations` |
| **Legal pages** | `/agb`, `/datenschutz`, `/impressum` live in-app |
| **Email template branding** | Rich HTML email template with CompLens gradient header, CTA button, bilingual footer |
| **planGuard helper** | `src/lib/api/planGuard.ts` — shared plan-check middleware for API routes |
| **Superadmin suspend / delete** | Admin can suspend or hard-delete user accounts |
| **Public pages** | `/(public)/` — readiness check, booking pages |
| **Remediation Budget Simulation** | `BudgetSimPanel` in `RemediationClient.tsx` — real-time payroll baseline + incremental cost projection per time horizon (6m / 1y / 18m / 2-3y) using raw import fields. |
| **Stripe Customer Portal** | `POST /api/stripe/portal` — licensed users can manage/cancel subscription via Stripe-hosted portal. Button in Settings → Abonnement tab. |
| **Trial expired overlay → support ticket** | "Support kontaktieren" link now routes to `/dashboard/help` instead of `mailto:`. |
| **Stripe German invoice setup** | Template wired to all subscription checkouts. `preferred_locales: ['de']` set on all customers. Products renamed to German Leistungsbeschreibung (§14 UStG). |
| **Trends module** | SVG line chart, department heatmap, grade heatmap, delta KPIs, year-over-year table — fully implemented. |
| **Salary Bands module** | Auto-detect grades, compute P25/median/P75/gender medians, EU Art. 9 compliance heatmap, market benchmarks, compa-ratio. Dashboard KPI card + Analysis tab + PDF section + Sidebar route. |
| **Stripe real price IDs** | `STRIPE_PRICE_LICENSE` + `STRIPE_PRICE_ADDITIONAL_ACCESS` set; wired in checkout + webhook routes |
| **Stripe webhook live** | `/api/stripe/webhook` active; `STRIPE_WEBHOOK_SECRET` configured |
| **Resend email** | `RESEND_API_KEY` + `RESEND_FROM_EMAIL` configured; all email flows functional |
| **All env vars set** | Supabase, Gemini, Resend, Stripe, `SUPERADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_APP_URL` |
| **GA4 Analytics** | `NEXT_PUBLIC_GA_MEASUREMENT_ID` confirmed set; `GoogleAnalytics` in `layout.tsx` — fully active |

---

## ✅ Completed — Report Module Polish (2026-03-25)

| Change | Detail |
|--------|--------|
| **EU compliance clarity** | "Bereiche" section tagged "Nicht EU-Pflicht (Art. 9)" in web report |
| **PDF: Bereiche default off** | PdfOptionsModal defaults departments to `false`; label updated to "(nicht EU-Pflicht)" |
| **PDF page order** | Entgeltbänder & Compa-Ratio placed immediately after Bereiche; legacy grade table conditional |
| **PPT: dept slide removed** | `addSlide3` no longer called; replaced by 2 band slides |
| **PPT: IQR chart slide** | New `addSalaryBandChartSlide` — horizontal range bars per grade with P25/median/P75 markers |
| **PPT: EU column labels** | `✓ Nein` → `✓ ok`, `⚠ Ja` → `⚠ n.k.` (consistent with PDF) |
| **PPT: table full width** | Columns redistributed from 6.69" to 9.0" (full slide); `n` col widened from 0.34" to 0.60" |
| **PPT: footer fixed** | "Erstellt mit CompLens" centered; no overlap with page number |
| **PPT: EUR labels** | P25/Median/P75 anchored to fixed track bounds (not IQR position) |
| **Title consistency** | All outputs (web H1, PDF title, PPT slide title + filename) use user-given dataset name |
| **Grundgehalt badge** | Chart slide clearly labelled as Grundgehalt; subtitle updated |
| **TypeScript** | `tsc --noEmit` → 0 errors across entire codebase |

---

## 🔲 Remaining — Post-Launch / Nice-to-Have

### 🟡 Medium
| Task | Notes |
|------|-------|
| **Add-on seat end-to-end test** | Route implemented; needs real SEPA/card payment test |
| **Compliance dashboard** | Dynamic Art. 9 sub-requirement status per org (planned) |
| **Employee portal polish** | Art. 7 PDF letter — final UX review |
| **Hero Showcase Carousel** | Astro landing page — awaiting 6 dashboard screenshots from live server |

### 🟢 Low
| Task | Notes |
|------|-------|
| **Custom email domain** | Verify `hallo@complens.de` in Resend dashboard |
| **Dataset comparison** | Side-by-side year-over-year diff view |
| **GDPR / AVV end-to-end test** | Confirm contract PDF download with real org legal fields |
| **Plausible Analytics** | Cookie-free GDPR stats for landing site |
| **Dead code cleanup** | `addSlide3` in `ReportPresentation.ts` — unused, harmless |
| **Desktop app** | Electron wrapper — not priority before June 2026 |

---

## Key File Paths

| What | Path |
|------|------|
| Web app root | `/Users/peter/Documents/DexterBee/PayLens/apps/web/` |
| Env file | `/Users/peter/Documents/DexterBee/PayLens/apps/web/.env.local` |
| DB migrations | `/Users/peter/Documents/DexterBee/PayLens/database/migrations/` |
| Pay gap engine | `apps/web/src/lib/calculations/payGap.ts` |
| Superadmin auth helper | `apps/web/src/lib/api/superadminAuth.ts` |
| Plan guard helper | `apps/web/src/lib/api/planGuard.ts` |
| i18n translations | `apps/web/src/lib/i18n/translations.ts` |
| PDF report | `apps/web/src/lib/pdf/ReportDocument.tsx` |
| PPT report | `apps/web/src/lib/ppt/ReportPresentation.ts` |
| Band context | `apps/web/src/lib/band/getBandContext.ts` |
| Stripe checkout | `apps/web/src/app/api/stripe/checkout/route.ts` |
| Stripe webhook | `apps/web/src/app/api/stripe/webhook/route.ts` |

## How to Resume Dev Server
```bash
cd /Users/peter/Documents/DexterBee/PayLens/apps/web
npm run dev
# App runs at http://localhost:3001
# Superadmin at http://localhost:3001/superadmin (login with an SUPERADMIN_EMAILS address)
```
