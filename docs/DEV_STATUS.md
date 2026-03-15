# PayLens — Development Status
*Last updated: 2026-03-10 20:23 CET*

---

## Current State: Phase 0 — Foundation (in progress)

### What is running
- Next.js 16 dev server on **http://localhost:3001**
  - Started with: `cd /Users/peter/Documents/DexterBee/PayLens/apps/web && npm run dev -- --port 3001`
- HR Street App 3 still running on **http://localhost:3000** (separate product, separate window)

---

## What has been built

### Infrastructure
| File | Status |
|------|--------|
| `apps/web/` | Next.js 16 + TypeScript + Tailwind v4 + App Router |
| `src/app/globals.css` | Full design system (deep navy palette, glass cards, brand buttons, AI badge, status pills) |
| `src/app/layout.tsx` | Root layout — SEO metadata (German), Inter font, `lang="de"` |
| `src/proxy.ts` | Auth guard — `/dashboard/*` requires login; `/login`+`/signup` redirect if logged in |
| `src/lib/supabase/server.ts` | Server-side Supabase client (SSR-safe, cookie-based) |
| `src/lib/supabase/client.ts` | Browser-side Supabase client |
| `src/lib/supabase/admin.ts` | ✅ Service-role client — bypasses RLS; used only for org provisioning |
| `.env.local` | ✅ Supabase + Gemini keys set; Stripe + Resend to be added later |

### Auth Flow
| Route | Status |
|-------|--------|
| `/login` | ✅ Complete — email/password, show/hide, German errors, GDPR note |
| `/signup` | ✅ Complete — company name, live password strength, trial info box, terms checkbox |
| `/signup/check-email` | ✅ Complete — post-registration confirmation screen |
| `/auth/confirm` | ✅ Complete — exchanges email code, **provisions org + member + onboarding rows via service role** |
| `(auth)/layout.tsx` | ✅ Complete — split-screen with brand panel left, form right |
| `(auth)/actions.ts` | ✅ Complete — `login()`, `signup()`, `signOut()` server actions |

### Database
| Item | Status |
|------|--------|
| `database/migrations/001_initial_schema.sql` | ✅ Executed in Supabase — all tables live |
| `organisations` | ✅ Table + RLS live |
| `organisation_members` | ✅ Table + RLS live |
| `datasets` | ✅ Table + RLS live |
| `employees` | ✅ Table + RLS live |
| `analyses` | ✅ Table + RLS live |
| `onboarding_progress` | ✅ Table + RLS live |
| Post-signup provisioning | ✅ `/auth/confirm` creates org + member + onboarding row on email verify |

### Dashboard Shell
| File | Status |
|------|--------|
| `(dashboard)/layout.tsx` | ✅ Complete — auth guard, sidebar + header wrapper |
| `components/dashboard/Sidebar.tsx` | ✅ Complete — German nav labels, active states, logo |
| `components/dashboard/Header.tsx` | ✅ Complete — AI assistant trigger, notifications, avatar |
| `(dashboard)/dashboard/page.tsx` | ✅ Complete — KPI cards, 5% threshold alert, empty state with import CTA |

---

## What needs to be done next (in order)

### Step 3 — AI Import Wizard ⬅ NEXT
The core product differentiator:
- Drag-and-drop file upload (CSV, XLSX, ODS) → Supabase Storage
- Gemini API column mapping with confidence scores
- GDPR opt-in prompt before AI call
- Manual mapping fallback for PayLens (non-AI) plan
- Saves to `datasets` + `employees` tables on confirm

### Step 4 — Pay Gap Calculation Engine
Shared TypeScript module (`apps/shared/calculations/`):
- Unadjusted gap (mean + median)
- Adjusted gap (WIF regression)
- Quartile distribution
- 5% threshold flag

### Step 5 — Report Generation (PDF + PPT)
- EU Directive report (PDF)
- German EntgTranspG format
- PowerPoint slide deck (pptxgenjs)

---

## Key file paths
| What | Path |
|------|------|
| Web app root | `/Users/peter/Documents/DexterBee/PayLens/apps/web/` |
| Env file | `/Users/peter/Documents/DexterBee/PayLens/apps/web/.env.local` |
| Master plan | `/Users/peter/Documents/DexterBee/PayLens/docs/product/MASTER_PLAN.md` |
| DB migration | `/Users/peter/Documents/DexterBee/PayLens/database/migrations/001_initial_schema.sql` |
| Shared calculation engine (to be created) | `/Users/peter/Documents/DexterBee/PayLens/apps/shared/calculations/` |

## How to resume dev server
```bash
cd /Users/peter/Documents/DexterBee/PayLens/apps/web
npm run dev -- --port 3001
# App runs at http://localhost:3001
```
