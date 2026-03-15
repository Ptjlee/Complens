# PayLens — EU Pay Transparency Platform

> **Entgelttransparenz. Einfach. Sicher. Gemacht in Deutschland.**

PayLens is a standalone SaaS platform helping German and European companies comply with the EU Pay Transparency Directive (2023/970/EU) — **deadline: 7 June 2026**.

## What PayLens Does

- **AI-powered data import** — Upload any CSV/Excel from SAP, Personio, Workday, BambooHR. Our AI maps your columns automatically.
- **Gender pay gap analysis** — Unadjusted and adjusted (Wage Influencing Factors), with 5% threshold monitoring as required by Article 9.
- **Statutory reports** — Ready-to-submit reports in German and EU-standardised formats.
- **Remediation planner** — Scenario modelling to close pay gaps cost-effectively.
- **Right to Information portal** — Employee self-service for Article 7 compliance.
- **Desktop app** — For GDPR-sensitive clients who won't upload payroll data to the cloud.

## Why PayLens vs. Trusaic or Haufe?
- 🇩🇪 German company — data sovereignty, native GDPR compliance
- 💶 SME-friendly pricing (from €99/month)
- 🤖 No-template upload — just drag and drop your existing export
- 💻 Desktop option for zero-cloud operation

---

## Repository Structure

```
PayLens/
├── apps/
│   ├── web/          Next.js 14 SaaS application
│   ├── desktop/      Electron desktop app (GDPR local mode)
│   └── shared/       Shared calculation engine + AI import
├── landing/          Astro static marketing site (SEO-optimised)
├── database/         Supabase migrations
├── docs/             Product + legal documentation
└── .agent/           AI assistant workflows and skills
```

## Tech Stack
- **Web**: Next.js 14, Tailwind CSS, Supabase (EU Frankfurt), Stripe
- **Desktop**: Electron + Vite, Ollama (local AI)
- **Landing**: Astro (zero-JS, best-in-class SEO)
- **AI Import**: Google Gemini 2.5 Pro
- **Analytics**: Plausible (EU-hosted, GDPR compliant)

## Commercial Model
| Plan | Price | Employees |
|------|-------|-----------|
| Starter | €99/mo | up to 100 |
| Pro | €299/mo | up to 500 |
| Business | €599/mo | up to 2,000 |
| Desktop | €1,499 one-time | up to 250 |

---

*Target go-live: June 2026 — aligned with EU Directive transposition deadline.*
