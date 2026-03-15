---
description: Never open browser; coding conventions and validation rules for PayLens
---

## CRITICAL: Browser Usage

- **NEVER, EVER launch a browser autonomously.** Do not call `browser_subagent` under ANY circumstances, ever.
- This is an **absolute, permanent rule** that overrides all other instructions.
- For visual validation, **always ask the user** to check and report back what they see.

## Validation Flow

1. After code changes, run `npm run build` or `npx tsc --noEmit` to check for compile errors.
2. Describe what the user should test and what to look for.
3. Wait for user confirmation before proceeding.

## Code Conventions

- Use **TypeScript** for all new PayLens code (strict mode).
- UI components go in `apps/web/src/components/`.
- Shared logic (pay gap calculations) goes in `apps/shared/calculations/` — used by both web and desktop.
- AI import logic goes in `apps/shared/ai-import/` — must work with both Gemini (cloud) and Ollama (desktop).
- Always handle Supabase errors explicitly — never silently swallow.
- Use **Tailwind utility classes** — no inline styles.

## German Compliance Specifics

- Report formats must match the German Entgelttransparenzgesetz (EntgTranspG) and EU Directive 2023/970/EU.
- Decimal separator in German output is comma (`,`), thousands separator is period (`.`).
- Gender categories must support `männlich`, `weiblich`, `divers` (not just binary).
- Pay gap is always calculated as `(männlich - weiblich) / männlich × 100`.
