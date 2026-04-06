# i18n English Translation — Change Log

**Branch:** `feat/i18n-english-pages`
**Date:** 2026-04-02 → 2026-04-05
**Scope:** Full English language support for CompLens (DE → DE+EN)

---

## Summary

Added complete English language support to CompLens. Users can switch between German and English via:
- **Pre-login:** Language switcher (cookie-based) on landing page, auth pages, legal pages, public pages
- **Post-login:** Settings → Profile → Preferred Language (DB-persisted, synced to cookie)

**2,084 translation keys** in both `de.json` and `en.json`, fully in sync.
**68 files modified**, **5 new files created** (excluding agent definitions and docs).

---

## What Changed

### 1. Translation Infrastructure
| File | Change |
|------|--------|
| `messages/de.json` | Expanded from ~60 keys to 2,084 keys across 23 sections |
| `messages/en.json` | Created full English mirror with 2,084 keys |
| `src/i18n/request.ts` | Now reads `NEXT_LOCALE` cookie for locale resolution (was hardcoded `'de'`) |
| `src/types/next-intl.d.ts` | **NEW** — TypeScript augmentation for compile-time key safety |
| `scripts/check-i18n-completeness.mjs` | **NEW** — CI script verifying all keys exist in all locales |

### 2. New Components
| File | Purpose |
|------|---------|
| `src/components/ui/LanguageSwitcher.tsx` | **NEW** — DE/EN toggle for pre-login pages (cookie-based) |
| `src/components/dashboard/LocaleSync.tsx` | **NEW** — Syncs DB language preference to cookie on first dashboard load |

### 3. Dashboard Shell (visible on every page)
| File | Change |
|------|--------|
| `Sidebar.tsx` | Nav labels via `useTranslations('nav')` |
| `Header.tsx` | Dropdown text via `useTranslations('header')` |
| `OnboardingModal.tsx` | All 4 onboarding steps via `useTranslations('onboarding')` |
| `TrialBanner.tsx` | Banner text via `useTranslations('dashboard.trial')` |
| `TrialExpiredOverlay.tsx` | Overlay text via `useTranslations('dashboard.expiredOverlay')` |
| `UpgradeGate.tsx` | Gate text via `useTranslations('upgradeGate')` |
| `CookieBanner.tsx` | GDPR banner via `useTranslations('cookie')` |
| `(dashboard)/layout.tsx` | Removed legacy `LanguageProvider`, added `LocaleSync` for cookie sync |

### 4. Dashboard Pages
| Page | File(s) | Change |
|------|---------|--------|
| Overview | `DashboardOverview.tsx` | KPI labels, alerts, charts |
| Import | `ImportWizard.tsx`, `page.tsx`, `constants.ts` | All 4 wizard steps, AVV gate, field labels with `labelEn` |
| Analysis | `AnalysisPage.tsx`, `AnalysisChatbot.tsx`, `EmployeesTab.tsx` | WIF labels, chatbot prompts, employee table, explanation drawer |
| Reports | `ReportsList.tsx`, `ReportView.tsx`, `PdfOptionsModal.tsx`, `generateNarrative.ts` | Report cards, full web report, PDF options, AI narrative (locale-aware prompt) |
| Remediation | `RemediationClient.tsx`, `actions.ts`, `page.tsx` | All UI + AI plan generation prompt is locale-aware |
| Settings | `SettingsClient.tsx`, `TeamPanel.tsx`, `SalaryBandsPanel.tsx` | All tabs (org, team, profile, billing, security, salary bands), language switcher now functional |
| Datasets | `DatasetsClient.tsx` | Table labels, actions, confirmations |
| Help | `HelpClient.tsx` | Full help documentation (103+ strings) |
| Portal | `PortalClient.tsx`, `page.tsx` | Art. 7 employee information |
| Trends | `TrendPageClient.tsx` | Chart labels, comparison mode, delta cards |
| Salary Bands | `SalaryBandModuleClient.tsx` | Band visualisation, compliance, market benchmarks |
| Charts | `PayGapChartGrid.tsx`, `BandVisualizationChart.tsx`, `ComplianceHeatmap.tsx` | All chart labels, tooltips, legends, disclaimers |

### 5. Auth Pages
| File | Change |
|------|--------|
| `login/page.tsx` | All form labels via `useTranslations('auth')` |
| `signup/page.tsx` | Form + terms via `useTranslations('auth')`, LanguageSwitcher added |
| `apply/page.tsx` | Multi-step form via `useTranslations('auth')` + `useTranslations('apply')` |
| `signup/check-email/page.tsx` | Confirmation screen via `useTranslations('auth')` |
| `(auth)/layout.tsx` | Left panel (headline, bullets, footer) via `getTranslations('auth')`, LanguageSwitcher added |
| `actions.ts` | Error messages via `getTranslations('auth')`, preferred_language seeded from cookie |
| `auth/confirm/route.ts` | Fallback org creation carries `full_name`, `preferred_language`, 14-day trial |

### 6. Public Pages
| File | Change |
|------|--------|
| `LandingClient.tsx` | Full landing page via `useTranslations('landing')`, LanguageSwitcher in navbar |
| `booking/page.tsx` | Booking page via `useTranslations('booking')` |
| `readiness-check/page.tsx` | Quiz via `useTranslations('readinessCheck')` |
| `agb/page.tsx` | Conditional DE/EN rendering based on locale cookie |
| `datenschutz/page.tsx` | Conditional DE/EN rendering based on locale cookie |

### 7. PDF & PPT Exports (locale-aware)
| File | Change |
|------|--------|
| `lib/pdf/ReportDocument.tsx` | Accepts `labels` prop + `locale`; all text from labels object |
| `lib/ppt/ReportPresentation.ts` | Accepts `labels` + `locale` in opts; all text from labels |
| `lib/pdf/PortalDocument.tsx` | Accepts `PortalLabels` + `locale`; full EN/DE support |
| `api/reports/[id]/pdf/route.ts` | Reads `NEXT_LOCALE` cookie, builds labels from messages, passes to PDF |
| `api/report/[id]/export-ppt/route.ts` | Same pattern for PPT |
| `api/portal/[analysisId]/[employeeId]/pdf/route.ts` | Reads locale, uses `LABELS_EN` or `LABELS_DE` |

### 8. API Routes (locale-aware)
| File | Change |
|------|--------|
| `api/analysis/[id]/chat/route.ts` | System prompt in user's language, knowledge base locale-aware |
| `api/chat/route.ts` | System prompt locale-aware |
| `api/contact/route.ts` | Email content via `getTranslations('contact')` |
| `api/support/ai-analyze/route.ts` | DE/EN system prompts |
| `api/support/ai-polish-reply/route.ts` | Polishing prompt locale-aware |
| `api/support/upload/route.ts` | Error messages via `getTranslations('errors')` |
| `api/profile/language/route.ts` | Now uses admin client (bypasses RLS), sets `NEXT_LOCALE` cookie |

### 9. Shared Libraries
| File | Change |
|------|--------|
| `lib/chatbot/knowledgeBase.ts` | Full English knowledge base added, `getKnowledgeBase(locale)` function |
| `lib/plans.ts` | `FEATURE_LABELS_EN` added, `getFeatureLabels(locale)` function |
| `import/constants.ts` | `labelEn` added to all fields, `getFieldLabel(field, locale)` helper |

### 10. Bug Fixes (discovered during i18n work)
| Fix | Detail |
|-----|--------|
| **Duplicate email signup crash** | Added `identities?.length === 0` check to detect Supabase's fake signup response. Returns "already registered" instead of crashing on FK violation. **This was a pre-existing production bug.** |
| **Trial period** | Changed from 7 days to 14 days in both `actions.ts` and `confirm/route.ts` |
| **Language API RLS bypass** | `/api/profile/language` now uses admin client to actually update `preferred_language` (was silently failing due to RLS) |
| **AGB/Privacy links** | Changed from `<Link>` (same-tab navigation, loses form data) to `<a target="_blank">` |
| **Terms checkbox** | `t.rich()` with `<agbLink>` tags instead of broken `{agbLink}` interpolation |

---

## Impact Assessment for Existing Users

### Will this disrupt existing German users?

**No.** Here's why:

1. **Default locale is German.** If no `NEXT_LOCALE` cookie exists (all current users), the system defaults to `'de'`. Every page renders in German exactly as before.

2. **No database schema changes.** The `preferred_language` column already exists in `organisation_members`. We only write to it — we don't add or remove columns. Existing rows have `preferred_language = 'de'` or `NULL` (which defaults to `'de'`).

3. **No database migrations required.** Zero SQL changes.

4. **No environment variable changes.** No new env vars needed.

5. **Signup flow is structurally identical.** The same sequence (create auth user → create org → create member → redirect) is preserved. Only the error messages changed from hardcoded German to `t('key')` which resolves to the same German text for German users.

6. **Existing analyses, reports, datasets are untouched.** No data processing logic was changed. Only UI text rendering.

7. **PDF/PPT exports default to German.** Without a `NEXT_LOCALE` cookie set to `'en'`, exports render in German — identical to current behaviour.

8. **The legacy `LanguageContext` was already unused in production.** It was imported but only had 2 consumers: `SettingsClient` (which showed "coming soon" for English) and `layout.tsx` (as a provider wrapper). Removing it has zero functional impact since it only stored a `lang` variable that was always `'de'`.

### What changes for existing German users after deploy?

- They see a **language switcher** in the auth pages (login, signup) and landing page — purely additive, doesn't affect German text
- In Settings → Profile, the "English coming soon" hint is replaced with a **working language toggle** — they can now switch to English if they want
- The **trial period** for new signups changes from 7 to 14 days — existing users' trial dates are not affected (stored in DB, not recalculated)
- The **duplicate email signup bug** is fixed — edge case, doesn't affect logged-in users

### What should be tested before push?

1. Existing user logs in → everything renders in German (no regressions)
2. Existing user's analyses, reports, datasets load correctly
3. PDF export generates in German
4. PPT export generates in German
5. New signup flow works (German)
6. New signup flow works (English)
7. Language switch DE→EN→DE works in Settings
8. Landing page renders in both languages

---

## Files NOT Changed (confirmed safe)

- No Supabase migrations
- No changes to `package.json` dependencies (only `i18n:check` script added)
- No changes to `next.config.ts`
- No changes to calculation logic (`lib/calculations/`)
- No changes to Stripe integration
- No changes to RLS policies
- No changes to storage/bucket configuration
