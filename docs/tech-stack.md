# Tech Stack

- **Frontend:** Astro on Cloudflare Workers (`@astrojs/cloudflare` adapter) + TypeScript (strict) + Preact islands + Plain CSS & PostCSS (reads pre-built metadata JSON directly from `PORTFOLIO_KV`)
- **Backend:** Hono on Cloudflare Workers (`apps/api`) acting as an edge sync service from Supabase to KV, plus auxiliary endpoints (tokenized links, view analytics)
- **Edge Storage / Cache:** Cloudflare Workers KV (shared binding `PORTFOLIO_KV`) storing pre-built metadata JSON
- **Data Access:** `packages/data-access` (repository pattern — strictly isolates database drivers per ADR-002)
- **Shared Layer:** `packages/shared` (Zod schemas and TypeScript domain types — 100% provider-agnostic)
- **Database:** Postgres (Supabase initially, swappable to Neon or self-hosted Postgres with zero changes to `apps/web` or `apps/api`)
- **Hosting & Edge Runtime:** Cloudflare Workers ONLY (`apps/web` and `apps/api` deployed via Wrangler)
- **Content Sync:** Database Webhook / Trigger $\rightarrow$ `apps/api` (Hono on Cloudflare Workers) $\rightarrow$ `PORTFOLIO_KV` (ADR-001)
- **CI/CD & Automation:** GitHub Actions, Playwright (automated PDF resume compilation + e2e), Vitest, Lighthouse CI, Cloudflare Wrangler
