# Tech Stack

- **Frontend:** Astro (static output: `output: "static"`) + TypeScript (strict) + Preact islands + Plain CSS & PostCSS
- **Backend:** Hono on Vercel Functions (serverless, auxiliary endpoints only)
- **Data Access:** `packages/data-access` (repository pattern — strictly isolates database drivers per ADR-002)
- **Shared Layer:** `packages/shared` (Zod schemas and TypeScript domain types — 100% provider-agnostic)
- **Database:** Postgres (Supabase initially, swappable to Neon or self-hosted Postgres with zero changes to `apps/web` or `apps/api`)
- **Hosting:** Vercel (`apps/web` and `apps/api` deployed as separate projects)
- **Content Sync:** Database Webhook / Trigger $\rightarrow$ Vercel Deploy Hook (ADR-001)
- **CI/CD & Automation:** GitHub Actions, Playwright (automated PDF resume compilation + e2e), Vitest, Lighthouse CI
