# Multi-Language Support — Revised Implementation Plan

## Critical Review of Original Plan

The original plan is structurally sound but has several problems that would cause wasted effort, incorrect priorities, and architectural missteps if followed as-is:

### What the Original Plan Gets Wrong

**1. The original plan's default locale is correct — German first.**
CompLens is a DACH-first product. German (`'de'`) is the correct default. English is the second language. The original plan got this right. The earlier revision incorrectly suggested flipping to English-first — that is now corrected.

**2. The plan overestimates the current mess.**
It claims "three conflicting i18n patterns." In reality:
- `next-intl` is used in exactly **2 components** (`DashboardOverview.tsx` — two `useTranslations` calls).
- The legacy `LanguageContext` is consumed in exactly **2 files** (`SettingsClient.tsx` + `layout.tsx` as provider).
- Everything else is hardcoded German.

This is not "three conflicting systems" — it's one barely-used library, one barely-used context, and a mountain of hardcoded strings. The consolidation effort is trivial (touch 2 files to remove legacy), not a major architectural decision.

**3. Cookie-based locale is premature complexity.**
The plan introduces a `NEXT_LOCALE` cookie + server action + DB sync + router refresh chain. For a product that currently has zero working language switching and targets English-first, this is overengineering. The simpler path: read `preferred_language` from the already-existing `organisation_members.preferred_language` DB column (which the dashboard layout already queries), and pass it to `next-intl`. No cookie. No server action. No sync problem. The cookie layer can be added later if needed for unauthenticated pages.

**4. "~500 keys" estimate is unvalidated.**
The current `de.json` has ~60 keys. The legacy `translations.ts` has ~90 keys. Many overlap. The plan claims ~500 keys will be needed but provides no inventory. Without an actual string audit, this number is a guess that will lead to either missing strings at launch or wasted effort translating unused keys.

**5. "Single-file addition" claim is misleading.**
Adding a language requires: (1) create JSON file, (2) add locale to `LOCALES` array, (3) translate ~all keys, (4) QA every page. Steps 3-4 are the actual work. The architecture making step 1-2 trivial is table stakes for any i18n library — it's not a design achievement.

**6. No mention of type safety for translation keys.**
`next-intl` supports TypeScript augmentation so `useTranslations()` catches missing/wrong keys at compile time. The plan never sets this up. Without it, you'll ship pages with `{common.svae}` rendering as literal text because nobody caught the typo.

**7. Layer ordering is wrong for "English first."**
The plan's layers go: infrastructure → message files → component migration → layout → formatting → PDF. If the goal is a working English product, you need to flip priorities: extract all hardcoded strings first (the actual bottleneck), then wire the infrastructure, then polish formatting.

**8. PDF/PPT export i18n is speculative.**
Layer 6 addresses PDF/PPT locale-awareness, but flags an "open question" about legal language requirements. This should be deferred entirely until the question is resolved. Partially internationalizing the PDF layer creates maintenance burden with unclear requirements.

**9. The plan ignores the public/marketing pages.**
`LandingClient.tsx`, booking pages, readiness-check — these are public-facing, SEO-relevant pages. The plan focuses entirely on the dashboard. Public pages need different i18n treatment (URL-based locale for SEO, `hreflang` tags, translated metadata). The plan's "no URL prefix" decision is correct for the dashboard but wrong for public pages.

**10. No CI/automation for translation completeness.**
The "Verification Plan" is entirely manual. There's no mention of a CI check that ensures `en.json` has every key that `de.json` has (and vice versa). This is the single most common i18n regression — someone adds a German string, forgets English, and a page shows a raw key in production.

---

## Revised Plan

### Guiding Principles

1. **German is the default locale.** English is the second language. Future languages added without code changes.
2. **Single i18n system: `next-intl`.** Delete the legacy context immediately — it has only 2 consumers.
3. **DB-driven locale for authenticated pages.** Dashboard layout reads `preferred_language` and sets cookie for `next-intl`.
4. **Type-safe keys.** Compile-time enforcement that every key exists in every locale.
5. **CI-enforced completeness.** A script that fails the build if locale files diverge.
6. **No speculative work.** PDF/PPT i18n deferred. Public page i18n deferred (separate concern with different architecture needs).
7. **Professional-grade translations.** Native quality German (Sie-Form, correct compounds, domain terminology). British English for EN.

---

### Phase 0 — String Audit (prerequisite, do not skip)

Before writing a single line of code, produce a complete inventory:

1. Run a grep across all `.tsx` files for quoted German strings (patterns: common German words, UI patterns like `className=` adjacent strings).
2. For each component file, list every user-visible string.
3. Assign each string a namespace + key name.
4. Produce the definitive key count. This becomes the source of truth for the message files.

**Deliverable:** A spreadsheet or markdown table: `file | string (DE) | string (EN) | namespace.key`

This audit prevents the "~500 keys" guessing game and ensures nothing is missed during migration.

---

### Phase 1 — Infrastructure (estimate: small, focused changes)

#### 1.1 Delete legacy i18n system

| Action | File |
|--------|------|
| DELETE | `src/lib/i18n/LanguageContext.tsx` |
| DELETE | `src/lib/i18n/translations.ts` |
| MODIFY | `src/app/(dashboard)/layout.tsx` — remove `LanguageProvider` wrapper, remove imports of `LanguageProvider` and `Lang` |
| MODIFY | `src/app/(dashboard)/dashboard/settings/SettingsClient.tsx` — replace `useTranslation()` from legacy context with `useTranslations()` from `next-intl` |

This is a 30-minute task touching 4 files. Do it first to eliminate confusion.

#### 1.2 Configure `next-intl` to read locale from DB

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export const LOCALES = ['de', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'de'

export default getRequestConfig(async () => {
    // For authenticated pages, the dashboard layout sets this cookie
    // from the DB-stored preferred_language. For unauthenticated pages,
    // fall back to German (DACH-first product).
    const store = await cookies()
    const raw = store.get('NEXT_LOCALE')?.value
    const locale: Locale = LOCALES.includes(raw as Locale)
        ? (raw as Locale)
        : DEFAULT_LOCALE

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    }
})
```

**Why still use a cookie?** Because `getRequestConfig` runs in the `next-intl` middleware/server layer where you don't have access to the Supabase session. The dashboard layout (which *does* have session access) sets the cookie from the DB value. This is a one-way sync: DB → cookie → `next-intl`. No bidirectional sync problem.

#### 1.3 Dashboard layout sets cookie from DB

```typescript
// In src/app/(dashboard)/layout.tsx, after fetching member:
import { cookies } from 'next/headers'

const preferredLocale = member?.preferred_language ?? 'de'
const store = await cookies()
const currentCookie = store.get('NEXT_LOCALE')?.value
if (currentCookie !== preferredLocale) {
    store.set('NEXT_LOCALE', preferredLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 400,
        sameSite: 'lax',
    })
}
```

No server action needed. No router refresh. The cookie is set on every authenticated page load from the single source of truth (DB).

#### 1.4 Language switching in Settings

When the user changes language in Settings:
1. POST to `/api/profile/language` (already exists) to update DB.
2. `router.refresh()` — the layout re-runs, reads new DB value, sets cookie, `next-intl` picks up the new locale.

No custom server action. No `LanguageProvider`. The existing API endpoint + a page refresh is all that's needed.

#### 1.5 Type-safe translation keys

```typescript
// src/types/next-intl.d.ts
import messages from '../../messages/de.json'

type Messages = typeof messages

declare global {
    interface IntlMessages extends Messages {}
}
```

This makes `t('nonexistent.key')` a TypeScript compile error. The German file is the source of truth for the type since it is the primary locale. Non-negotiable for a project this size.

#### 1.6 Update `routing.ts`

```typescript
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
    locales: ['de', 'en'],
    defaultLocale: 'de',
    localePrefix: 'never', // Dashboard is behind auth, no URL prefixing
})

export type Locale = (typeof routing.locales)[number]
```

Changed `localePrefix` from `'as-needed'` to `'never'` — there are no public translated routes yet.

---

### Phase 2 — Message Files

#### 2.1 Build `de.json` as the primary file

Using the Phase 0 audit, expand the existing German message file to cover all hardcoded strings. Structure by feature module:

```json
{
    "common": { "save": "Save", "cancel": "Cancel", ... },
    "nav": { "dashboard": "Dashboard", "import": "Import", ... },
    "severity": { ... },
    "gender": { ... },
    "auth": { "login": "Log in", "signup": "Sign up", ... },
    "dashboard": {
        "kpi": { ... },
        "alert": { ... },
        "trend": { ... },
        "onboarding": { ... },
        "trial": { ... },
        "overview": { ... }
    },
    "import": { ... },
    "analysis": { ... },
    "employees": { ... },
    "chatbot": { ... },
    "explanations": { ... },
    "remediation": { ... },
    "reports": { ... },
    "salaryBands": { ... },
    "trends": { ... },
    "portal": { ... },
    "compliance": { ... },
    "help": { ... },
    "settings": { ... },
    "errors": { ... },
    "datasets": { ... }
}
```

#### 2.2 Build `en.json` as the mirror

Translate every German key to professional British English. Many translations already exist in the current `en.json` and `translations.ts` — consolidate them here.

#### 2.3 CI completeness check

Add a script to `package.json`:

```json
{
    "scripts": {
        "i18n:check": "node scripts/check-i18n-completeness.mjs"
    }
}
```

```javascript
// scripts/check-i18n-completeness.mjs
import en from '../messages/en.json' with { type: 'json' }
import de from '../messages/de.json' with { type: 'json' }

function flatKeys(obj, prefix = '') {
    return Object.entries(obj).flatMap(([k, v]) => {
        const key = prefix ? `${prefix}.${k}` : k
        return typeof v === 'object' && v !== null ? flatKeys(v, key) : [key]
    })
}

const enKeys = new Set(flatKeys(en))
const deKeys = new Set(flatKeys(de))

const missingInDe = [...enKeys].filter(k => !deKeys.has(k))
const missingInEn = [...deKeys].filter(k => !enKeys.has(k))

let failed = false
if (missingInDe.length) {
    console.error(`Missing in de.json:\n  ${missingInDe.join('\n  ')}`)
    failed = true
}
if (missingInEn.length) {
    console.error(`Missing in en.json:\n  ${missingInEn.join('\n  ')}`)
    failed = true
}

if (failed) process.exit(1)
else console.log('i18n check passed: all keys present in all locales.')
```

Wire into CI: `npm run i18n:check` runs alongside `typecheck` and `build`.

---

### Phase 3 — Component Migration

This is the bulk of the work. Migrate systematically by module, not by "layer."

**Rules:**
- Every component gets migrated completely. No half-translated files.
- Use `useTranslations('namespace')` for client components.
- Use `getTranslations('namespace')` for server components.
- For dynamic values, use ICU interpolation: `t('alert.description', { gap: 5.2 })`.
- Do NOT translate developer-facing strings (console.log, error codes, API keys).
- Do NOT translate legal identifiers (Article numbers like "Art. 9" stay as-is).

**Migration order (by risk/visibility):**

| Priority | Module | Files | Rationale |
|----------|--------|-------|-----------|
| 1 | Navigation shell | `Sidebar.tsx`, `Header.tsx` | Visible on every page. Sets the tone. |
| 2 | Dashboard | `DashboardOverview.tsx`, chart components | Landing page after login. |
| 3 | Settings | `SettingsClient.tsx`, `TeamPanel.tsx`, `SalaryBandsPanel.tsx` | Contains the language switcher itself. |
| 4 | Analysis | `AnalysisPage.tsx`, `EmployeesTab.tsx`, `AnalysisChatbot.tsx` | Core product value. |
| 5 | Import | `ImportWizard.tsx` | First-run experience. |
| 6 | Reports | `ReportsList.tsx`, `ReportView.tsx`, `PdfOptionsModal.tsx` | Key deliverable. |
| 7 | Other modules | Remediation, Trends, SalaryBands, Help, Compliance, Portal, Datasets | Less frequently accessed. |
| 8 | Auth pages | Login, Signup, Join, Apply | Separate concern — unauthenticated. |
| 9 | Error pages | `error.tsx` | Edge case. |

**Per-file migration pattern:**

```typescript
// Before:
<h1>Entgeltanalyse</h1>
<p>Ihr bereinigter Gender Pay Gap von {gap}% überschreitet die Grenze.</p>

// After:
const t = useTranslations('analysis')
<h1>{t('title')}</h1>
<p>{t('alert.exceeds', { gap })}</p>
```

---

### Phase 4 — Date/Number/Currency Formatting

Replace all `toLocaleDateString('de-DE', ...)` and `toLocaleString('de-DE', ...)` calls.

**Current situation:** 20+ call sites hardcode `'de-DE'`. These are spread across:
- `SettingsClient.tsx` (2 sites)
- `AnalysisPage.tsx` (3 sites)
- `EmployeesTab.tsx` (2 sites)
- `TeamPanel.tsx` (1 site)
- `SalaryBandsPanel.tsx` (1 site)
- `PortalClient.tsx` (1 site)
- `DatasetsClient.tsx` (likely)
- `ReportView.tsx` (likely)
- `TrendPageClient.tsx` (likely)
- Superadmin files (5 sites — lower priority)
- API routes: `chat/route.ts`, `contracts/*/route.ts`, `stripe/proforma/route.ts` (4 sites)

**Approach for client components:**

```typescript
import { useFormatter } from 'next-intl'

const format = useFormatter()
// Date:
format.dateTime(new Date(x), { day: '2-digit', month: 'short', year: 'numeric' })
// Number:
format.number(salary, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
// Currency:
format.number(amount, { style: 'currency', currency: 'EUR' })
```

**Approach for API routes:**
API routes that generate documents (contracts, proformas) should accept a `locale` parameter and use `Intl.DateTimeFormat(locale, ...)` directly. Don't force `next-intl` into API routes where it doesn't belong.

---

### Phase 5 — Metadata

Convert all static `export const metadata` to `generateMetadata()` for pages that need locale-aware titles:

```typescript
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
    const t = await getTranslations('metadata')
    return { title: t('analysis.title') }
}
```

**Root layout** (`src/app/layout.tsx`): The metadata, OpenGraph, JSON-LD, and description are currently all hardcoded German. These need special treatment:
- For dashboard pages (behind auth): translate normally.
- For public pages: this depends on whether you implement URL-based locale for public routes (deferred — see "Out of Scope").

---

## Out of Scope (Deliberately Deferred)

| Item | Why deferred |
|------|-------------|
| **PDF/PPT export i18n** | Legal language requirements unresolved. Do this when German is added as second language and the legal question is answered. |
| **Public page i18n** (landing, booking, readiness-check) | Requires URL-based locale prefixing for SEO (`/en/`, `/de/`), `hreflang` tags, translated OG metadata. Different architecture from dashboard i18n. Separate initiative. |
| **Superadmin panel i18n** | Internal tool, German-only is fine. |
| **AI chatbot response language** | The chatbot prompt engineering is a separate concern. The UI chrome around the chatbot gets translated; the AI responses are a prompt-level decision. |
| **RTL language support** | Not needed for any target language in the foreseeable future. Don't add `dir` attributes or RTL CSS now. |

---

## Verification Plan

### Automated (CI-enforced)

```bash
npm run typecheck       # Zero TS errors (catches wrong translation keys via IntlMessages)
npm run build           # Production build succeeds
npm run lint            # No regressions
npm run i18n:check      # All locale files have identical key sets
```

### Manual QA Checklist

- [ ] Fresh login → entire dashboard renders in German (default)
- [ ] Change language to English in Settings → POST succeeds, page refresh shows all English
- [ ] Change back to German → all strings revert
- [ ] Close browser, reopen → language persists (DB-driven, not session-dependent)
- [ ] New user signup → defaults to German
- [ ] Every dashboard page visited in German — zero English strings visible (except brand names, legal article numbers)
- [ ] Every dashboard page visited in English — zero German strings visible (except brand names, legal article numbers)
- [ ] All dates format correctly per locale (e.g., "Apr 1, 2026" in EN vs "01.04.2026" in DE)
- [ ] All numbers format correctly (e.g., "1,234.56" in EN vs "1.234,56" in DE)
- [ ] Currency always shows EUR regardless of locale
- [ ] Auth flows (login, signup, join) still work
- [ ] Stripe checkout still triggers correctly
- [ ] AI chatbot UI renders in correct language
- [ ] Support ticket submission works

### Future Language Expansion Test

When adding German (or any subsequent language):
1. Ensure `de.json` has every key from `en.json` (`npm run i18n:check` enforces this)
2. Add `'de'` to `LOCALES` if not already present
3. Full QA pass in that language

---

## Summary of Differences from Original Plan

| Aspect | Original | Revised |
|--------|----------|---------|
| Default locale | German (`'de'`) | German (`'de'`) — confirmed correct |
| Locale resolution | Cookie + server action + router refresh | DB → cookie (set in layout), no server action |
| Legacy system removal | Described but buried in layers | **Phase 1, step 1** — do it immediately |
| Type safety | Not mentioned | `IntlMessages` augmentation, compile-time key checking |
| String audit | Assumed ~500 keys | Mandatory Phase 0 audit before any code |
| CI enforcement | None | `i18n:check` script validates key parity |
| PDF/PPT i18n | Included (Layer 6) | Deferred — requirements unclear |
| Public page i18n | Ignored | Explicitly deferred — needs different architecture |
| Superadmin i18n | Included | Explicitly excluded — internal tool |
| Migration order | By "layer" (horizontal) | By module/priority (vertical) |
| Metadata | Brief mention | Explicit handling for root vs page-level |
| Formatting | Mentioned | Specific file inventory with 20+ call sites identified |
