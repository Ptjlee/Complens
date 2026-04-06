# Multi-Language Support — Best-Practice Architecture

## Goal

Make CompLens a properly internationalised platform, starting with English (EN), with an architecture that makes adding any future language (FR, NL, ES, etc.) a **single-file addition** — no code changes required.

---

## Current State & Problems

The codebase has **three conflicting i18n patterns** that must be consolidated:

| Pattern | Where | Problem |
|---------|-------|---------|
| **`next-intl`** (v4.8.3) | `messages/{de,en}.json`, `i18n/request.ts`, root `layout.tsx` | Hardcoded to `locale = 'de'` — never reads user preference. Only 3 call sites use it. |
| **Legacy `LanguageContext`** | `lib/i18n/LanguageContext.tsx`, `translations.ts` | Custom React context + 180-key flat dictionary. Used in 2 components. Duplicates what `next-intl` does. |
| **Hardcoded German** | ~30 component files, ~378 lines | The vast majority of UI text. No i18n at all. |

> **⚠️ CAUTION**: Keeping two parallel i18n systems is a maintenance liability and will confuse every future developer. The legacy system must be fully eliminated, not wrapped.

---

## Architecture Decisions

### 1. Single i18n System: `next-intl`

**Decision**: Consolidate entirely on `next-intl`. Delete the legacy `LanguageContext` and `translations.ts`.

**Rationale**: `next-intl` is the industry standard for Next.js App Router. It supports:
- Server Components via `getTranslations()`
- Client Components via `useTranslations()`
- Metadata via `generateMetadata()`
- Server Actions via `getTranslations()`
- ICU message format (plurals, interpolation)
- Date/number formatting locale-aware
- TypeScript augmentation for type-safe keys

### 2. No URL Prefix (Cookie-Based Locale)

**Decision**: Use `next-intl` **without i18n routing** — no `[locale]` segment, no `/en/dashboard` URLs.

**Rationale**: CompLens is an authenticated B2B SaaS dashboard. Users log in and their language preference is stored in the database. URL-based locale adds complexity (middleware rewrites, `[locale]` folder nesting) with zero SEO benefit since dashboard pages are behind auth and not crawled.

**How it works**:
```
User selects language → Server Action sets NEXT_LOCALE cookie + saves to DB
                       → Router refresh → next-intl reads cookie → serves correct messages
```

### 3. Namespaced Message Files (Per Module)

**Decision**: Organise translations by **feature module** using nested JSON namespaces in a single file per locale.

**Rationale**: For CompLens's scale (~500 keys), a single well-structured JSON per locale is more maintainable than dozens of small files. Adding a language = copy one file. Namespaces prevent key collisions and enable scoped `useTranslations('dashboard.kpi')`.

```
messages/
  de.json     ← German (primary, ~500 keys)
  en.json     ← English (mirror structure)
  fr.json     ← Future: just add this file + register locale
```

### 4. Locale-Aware Formatting

**Decision**: Use `next-intl`'s `useFormatter()` for all dates, numbers, and currencies instead of hardcoded `toLocaleDateString('de-DE')`.

**Rationale**: Currently ~15 call sites hardcode `'de-DE'` locale in date formatting. These silently break when a user switches to English. `next-intl` resolves the formatter's locale from the same source as translations.

### 5. PDF/PPT Exports — Language-Aware

**Decision**: Pass the user's locale to the PDF/PPT generation layer. Reports should render in the user's chosen language.

**Rationale**: While the EU Directive doesn't mandate a specific report language, CompLens targets international companies within the EU. An English-speaking HR Director in a German company rightfully expects English reports. The legal compliance content (Article references, thresholds) remains technically accurate in any language.

> **Open question**: If there's a legal requirement for German-only compliance reports, we could offer a "report language" selector in the PdfOptionsModal (default: user language, option: Deutsch). Decide before implementing Layer 6.

---

## Proposed Changes

### Layer 1 — Infrastructure

#### [MODIFY] `src/i18n/request.ts`
Read locale from `NEXT_LOCALE` cookie, validate against allowed locales, fall back to `'de'`:
```typescript
import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

const LOCALES = ['de', 'en'] as const
type Locale = (typeof LOCALES)[number]

export default getRequestConfig(async () => {
    const store = await cookies()
    const raw = store.get('NEXT_LOCALE')?.value
    const locale: Locale = LOCALES.includes(raw as Locale) ? (raw as Locale) : 'de'
    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    }
})
```

#### [MODIFY] `src/i18n/routing.ts`
Keep as reference config. No middleware needed since we're not using URL-based routing.

#### [NEW] `src/i18n/locale.ts` — Server Action for locale switching
```typescript
'use server'
import { cookies } from 'next/headers'

export type Locale = 'de' | 'en'
export const LOCALES: Locale[] = ['de', 'en']
export const DEFAULT_LOCALE: Locale = 'de'

export async function setLocale(locale: Locale) {
    const store = await cookies()
    store.set('NEXT_LOCALE', locale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 400, // ~13 months
        sameSite: 'lax',
    })
}
```

> **💡 Adding a new language in the future**: 1) Add `'fr'` to the `LOCALES` array. 2) Create `messages/fr.json`. 3) Done — no other code changes.

#### [DELETE] `src/lib/i18n/LanguageContext.tsx` — Legacy, replaced by `next-intl`
#### [DELETE] `src/lib/i18n/translations.ts` — Legacy, replaced by `messages/*.json`

---

### Layer 2 — Message Files (Comprehensive)

#### [MODIFY] `messages/de.json` — Expand from ~160 to ~500 keys
#### [MODIFY] `messages/en.json` — Mirror with English translations

Namespace structure:

```json
{
  "common": { },
  "nav": { },
  "metadata": { },
  "auth": { },
  "dashboard": {
    "kpi": { },
    "alert": { },
    "trend": { },
    "band": { },
    "onboarding": { },
    "trial": { },
    "overview": { }
  },
  "import": { },
  "analysis": { },
  "explanations": { },
  "remediation": { },
  "reports": { },
  "salaryBands": { },
  "trends": { },
  "portal": { },
  "compliance": { },
  "help": { },
  "settings": {
    "tabs": { },
    "org": { },
    "profile": { },
    "team": { },
    "billing": { },
    "security": { }
  },
  "errors": { },
  "pdf": { },
  "ppt": { }
}
```

Every key from the legacy `translations.ts` migrates into this structure. Every hardcoded German string across all 30+ components gets a key.

---

### Layer 3 — Component Migration (All Modules)

Quality-first: migrate **every component file**. No mixed-language states are acceptable.

#### Navigation Shell

| File | Changes |
|------|---------|
| `src/components/dashboard/Sidebar.tsx` | Replace 12 hardcoded labels with `useTranslations('nav')` |
| `src/components/dashboard/Header.tsx` | Translate menu items, logout text |
| `src/components/dashboard/OnboardingModal.tsx` | Translate 5-step wizard |
| `src/components/dashboard/TrialBanner.tsx` | Translate countdown strings |
| `src/components/dashboard/TrialExpiredOverlay.tsx` | Translate overlay messaging |
| `src/components/dashboard/UpgradeGate.tsx` | Translate gate messaging |

#### Dashboard

| File | Changes |
|------|---------|
| `DashboardOverview.tsx` | Extend existing `useTranslations`, replace remaining ~15 hardcoded strings (band labels, alerts, employee abbreviation) |
| `PayGapChartGrid.tsx` | Chart labels, axis labels, tooltips |
| `BandVisualizationChart.tsx` | Chart legends, grade labels |
| `ComplianceHeatmap.tsx` | Table headers, compliance labels |

#### Import Module

| File | Changes |
|------|---------|
| `ImportWizard.tsx` (~1088 lines) | Steps, labels, validation messages, dropzone text, AI mapping UI |

#### Analysis Module

| File | Changes |
|------|---------|
| `AnalysisPage.tsx` (~789 lines) | Tab labels, filter dropdowns, section headers |
| `EmployeesTab.tsx` (~1037 lines) | Table headers, severity labels, gender labels, explanation UI |
| `AnalysisChatbot.tsx` (~472 lines) | Placeholder text, role labels, default messages |

#### Settings Module

| File | Changes |
|------|---------|
| `SettingsClient.tsx` (~1123 lines) | Tab labels, org form, profile form, billing section, legal fields, language selector. **Remove "English coming soon" blocker**. Replace `useTranslation()` with `useTranslations()`. Wire language selector to server action + router refresh. |
| `TeamPanel.tsx` (~546 lines) | Invite form, role labels, member list |
| `SalaryBandsPanel.tsx` (~586 lines) | Band settings UI |

#### Reports Module

| File | Changes |
|------|---------|
| `ReportsList.tsx` (~339 lines) | Report cards, date formatting |
| `ReportView.tsx` (~874 lines) | All report sections, headers, legal text |
| `PdfOptionsModal.tsx` (~245 lines) | Toggle labels, section names |

#### Other Modules

| File | Changes |
|------|---------|
| `RemediationClient.tsx` (~1609 lines) | Plan form, steps, budget simulation, status labels |
| `TrendPageClient.tsx` (~762 lines) | Chart labels, heatmap, delta KPIs |
| `SalaryBandModuleClient.tsx` (~496 lines) | Band table, market benchmarks |
| `HelpClient.tsx` (~703 lines) | Ticket form, guide content, category labels |
| `compliance/page.tsx` (~482 lines) | GDPR content, compliance checklists |
| `portal/page.tsx` | Art. 7 portal text |
| `datasets/DatasetsClient.tsx` (~342 lines) | Dataset table, archive/delete confirmations |

#### Auth Pages

| File | Changes |
|------|---------|
| login, signup, join, apply pages | Form labels, error messages, success messages |

#### Error Page

| File | Changes |
|------|---------|
| `error.tsx` | Error boundary messaging |

#### Page Metadata

| File | Changes |
|------|---------|
| All `page.tsx` files with `export const metadata` | Convert to `generateMetadata()` using `getTranslations('metadata')` |

---

### Layer 4 — Layout & Provider Changes

#### [MODIFY] `src/app/layout.tsx` (root)
- Already correctly uses `NextIntlClientProvider` + `getLocale()` + `getMessages()`
- `<html lang={locale}>` — already done
- Convert static `export const metadata` to `generateMetadata()` for bilingual OG/Twitter tags

#### [MODIFY] `src/app/(dashboard)/layout.tsx`
- **Remove `<LanguageProvider>`** wrapper entirely
- Remove imports of `LanguageProvider` and `Lang`
- On SSR: if `NEXT_LOCALE` cookie is missing or mismatches DB value, set cookie from DB preferred_language (keep DB as source of truth)

#### [MODIFY] `src/app/api/profile/language/route.ts`
- Keep API endpoint
- Also set the `NEXT_LOCALE` cookie in the response so both systems stay in sync

---

### Layer 5 — Date/Number Formatting

Replace all hardcoded `toLocaleDateString('de-DE', ...)` calls with `next-intl`'s `useFormatter()`:

```typescript
// Before (broken when user is EN)
new Date(x).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })

// After (locale-aware)
const format = useFormatter()
format.dateTime(new Date(x), { day: '2-digit', month: 'short', year: 'numeric' })
```

Affected files: `DashboardOverview`, `ReportView`, `AnalysisPage`, `TrendPageClient`, `DatasetsClient`, `SettingsClient`, and others (~15 call sites total).

---

### Layer 6 — PDF/PPT Exports

#### [MODIFY] `src/lib/pdf/ReportDocument.tsx`
- Accept `locale: Locale` parameter
- Load translation strings for PDF sections
- All section titles, legal text, tooltips rendered in user's language

#### [MODIFY] `src/lib/ppt/ReportPresentation.ts`
- Accept `locale: Locale` parameter
- Load translation strings for slide titles, labels, compliance tags

#### [MODIFY] Report generation API routes
- Read user's locale from cookie/DB and pass to PDF/PPT generators

---

## Verification Plan

### Automated
```bash
npm run typecheck    # Zero TS errors
npm run build        # Production build succeeds
npm run lint         # No linting regressions
```

### Functional Testing
- Switch to English in Settings → **every visible string** across all pages renders in English
- Switch back to German → everything reverts
- Reload browser → language persists (cookie)
- New incognito session → defaults to German
- PDF export in EN mode → English report
- PPT export in EN mode → English slides
- All date/number formatting adapts to locale
- Superadmin panel remains functional

### Regression Check
- Auth flows (login, signup, join) work in both languages
- Stripe checkout still triggers correctly
- AI chatbot still functions
- Support ticket submission works
- All API routes return correct responses

### Future Language Expansion Test
- Duplicate `en.json` → `fr.json`, add `'fr'` to `LOCALES`
- Verify French appears as an option and renders correctly
- Remove test file after verification
