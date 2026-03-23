# PayLens / CompLens — Development Status
*Last updated: 2026-03-19 22:19 CET*

---

## Current State: Phase 3 — In Progress

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
| **Internationalisation (DE/EN)** | `LanguageContext` + `translations.ts`; preference stored in `organisation_members.preferred_language` (migration 017) |
| **Contract generation** | `/api/contracts/avv` + `/api/contracts/license` — auto-generated from org legal fields |
| **Org legal fields** | Migration 018 — `legal_representative`, `legal_address`, `legal_city`, `legal_zip`, `vat_id` on `organisations` |
| **Legal pages** | `/agb`, `/datenschutz`, `/impressum` live in-app |
| **Email template branding** | Rich HTML email template with CompLens gradient header, CTA button, bilingual footer |
| **planGuard helper** | `src/lib/api/planGuard.ts` — shared plan-check middleware for API routes |
| **Superadmin suspend / delete** | Admin can suspend or hard-delete user accounts |
| **Public pages** | `/(public)/` — readiness check, booking pages |

---

## 🔲 Remaining — Phase 3 / Launch

### 🔴 High (blockers for production)

| Task | Notes |
|------|-------|
| **Stripe price IDs** | `STRIPE_PRICE_PAYLENS` must use real price ID from Stripe dashboard |
| **Stripe webhook on Vercel** | Register endpoint + set `STRIPE_WEBHOOK_SECRET` in Vercel env |
| **All env vars on Vercel** | Gemini, Resend, Supabase, Stripe, `SUPERADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL` |

### 🟡 Medium (important before launch)

| Task | Notes |
|------|-------|
| **Remediation Budget Simulation** | `RemediationClient.tsx` — Add Budget Widget mapping actual incremental payroll costs across time horizons based purely on initial dataset fields. |
| **Support email delivery** | Wire admin reply in Support tab to send actual Resend email to user |
| **Add-on seat Stripe checkout** | `/api/stripe/checkout?product=addon-seat` route not yet implemented |
| **Stripe customer portal** | Let licensed users manage/cancel subscription |
| **Trends module** | UI scaffolded; needs multi-year comparison logic wired to real data |
| **Compliance dashboard** | Dynamic status per EU Art. 9 sub-requirement |
| **Employee portal polish** | Art. 7 PDF letter final review + token auth |
| **Landing page** | Astro site needs UI showcase section + contact form CTA |

### 🟢 Low (post-launch / nice-to-have)

| Task | Notes |
|------|-------|
| **Custom email domain** | Verify `hallo@complens.de` in Resend dashboard |
| **Dataset side-by-side comparison** | Year-over-year diff view |
| **GDPR / AVV end-to-end test** | Confirm contract PDF download flow with real org legal fields |
| **Desktop app** | Electron wrapper — not priority before June 2026 |

---

## Key File Paths

| What | Path |
|------|------|
| Web app root | `/Users/peter/Documents/DexterBee/PayLens/apps/web/` |
| Env file | `/Users/peter/Documents/DexterBee/PayLens/apps/web/.env.local` |
| DB migrations | `/Users/peter/Documents/DexterBee/PayLens/database/migrations/` |
| Pay gap engine | `/Users/peter/Documents/DexterBee/PayLens/apps/web/src/lib/calculations/payGap.ts` |
| Superadmin auth helper | `/Users/peter/Documents/DexterBee/PayLens/apps/web/src/lib/api/superadminAuth.ts` |
| Plan guard helper | `/Users/peter/Documents/DexterBee/PayLens/apps/web/src/lib/api/planGuard.ts` |
| i18n translations | `/Users/peter/Documents/DexterBee/PayLens/apps/web/src/lib/i18n/translations.ts` |
| PDF report | `/Users/peter/Documents/DexterBee/PayLens/apps/web/src/lib/pdf/ReportDocument.tsx` |
| PPT report | `/Users/peter/Documents/DexterBee/PayLens/apps/web/src/lib/ppt/ReportPresentation.ts` |

## How to Resume Dev Server
```bash
cd /Users/peter/Documents/DexterBee/PayLens/apps/web
npm run dev
# App runs at http://localhost:3001
# Superadmin at http://localhost:3001/superadmin (login with an SUPERADMIN_EMAILS address)
```
