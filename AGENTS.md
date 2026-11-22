# AGENTS.md — Operating Rules for AI Agents in This Repo

## Non-negotiable architecture rules

1. **Deployment Platform (Cloudflare Workers ONLY):**
   Deployments target Cloudflare Workers exclusively via Wrangler. No Vercel or other hosting platforms are used.
2. **Monorepo Structure & Separation of Concerns:**
   - `apps/web`: Astro frontend deployed to Cloudflare Workers (`@astrojs/cloudflare`), reading pre-built metadata JSON directly from `PORTFOLIO_KV`.
   - `apps/api`: Hono backend deployed to Cloudflare Workers, acting as an edge sync service from Supabase to KV, plus tokenized links and view analytics.
   - `packages/data-access`: Dedicated repository layer. The ONLY package permitted to import `@supabase/supabase-js` or any direct database driver.
   - `packages/shared`: Pure, provider-agnostic Zod schemas and TypeScript domain types.
3. **Database Access Abstraction (ADR-002):**
   Only `packages/data-access` may import `@supabase/supabase-js` or database drivers. `apps/web` and `apps/api` must call repository functions exported by `@portfolio/data-access`. The app layer must remain completely decoupled from any specific database vendor.
4. **Zero DB Reads Per Visitor (ADR-001):**
   `apps/web` reads metadata JSON directly from the shared Cloudflare Workers KV binding (`PORTFOLIO_KV`). Visiting the website costs 0 database queries. Never introduce per-request database calls to PostgreSQL for page visitors.
5. **Automated Content Sync Pipeline (ADR-001):**
   Content updates happen via database change trigger/webhook $\rightarrow$ `apps/api` (Hono on Cloudflare Workers) $\rightarrow$ updates `PORTFOLIO_KV`. Never build a "redeploy manually to update content" workflow.
6. **No Over-Engineered Caching Layers:**
   Do not introduce Redis, Debezium CDC, or complex edge-cache-tag infrastructure unless a new ADR justifies it against real traffic metrics. Cloudflare Workers KV (`PORTFOLIO_KV`) serves as the edge store.
7. **Cross-Browser Baseline:**
   Review `docs/requirements.md` browser support policy before choosing any CSS or JS feature. Plain CSS with semantic HTML must render all core content even with JavaScript disabled.
8. **No All-at-Once Scaffolding:**
   Follow `docs/roadmap.md` strictly in sequential phases. Complete and verify each phase before moving to the next.

## Before making changes
- Read `docs/architecture.md`, `docs/adr/001-cloudflare-workers-and-kv.md`, and `docs/tech-stack.md` first.
- Check `docs/roadmap.md` for current phase — do not implement a later phase early.

## Current Status & Checkpoint
- **Completed:**
  - Phase 0: Repo Skeleton & Authoritative Documentation.
  - Phase 1: Documentation Alignment & ADR-001 (Cloudflare Workers + KV architecture realigned; all Vercel references removed; ADR-001 authored).
  - Phase 2: Shared schemas (`packages/shared`) & stubbed data-access (`packages/data-access`).
  - Phase 3: Astro frontend (`apps/web`) configured for Cloudflare Workers with `@astrojs/cloudflare` adapter, `wrangler.jsonc` (`PORTFOLIO_KV` binding), homepage reading from repository layer, and verified production builds.
  - Phase 4: Hono Sync Backend (`apps/api`) scaffolded with Cloudflare Workers types, `wrangler.jsonc`, `PORTFOLIO_KV` bindings, health/sync endpoints, and verified typechecking.
  - Phase 6: Dependency Inspection & LTS Alignment (Node >=26 engines, pnpm 12.21.0, CI Node 26, TypeScript standardized to 7.0.2 across all packages, upgraded wrangler, hono, and patched sub-dependencies via workspace overrides).
  - Phase 7: Baseline Security Hardening (Global secureHeaders, CSRF, and CORS origin allowlists on `apps/api`; `POST /sync` secret authentication; Astro `security: { checkOrigin: true }`; dynamic URL validation and dangerous scheme rejection).
  - Code Review & Remediation (CodeRabbit): Fixed CORS/CSRF domain suffix bypass vulnerability, added constant-time `timingSafeEqual` via Web Crypto on `POST /sync`, patched protocol-relative URL bypass in `sanitizeUrl`, added `pnpm build` to CI workflow, and migrated inline event listener to script block for strict CSP compatibility.
- **Active / Next:** Phase 5 — Postgres Database (Supabase) Schema & Real Data-Access Integration, followed by Phase 6 (Automated Content Sync Pipeline via `PORTFOLIO_KV`).

## Source of truth
- This repository's `docs/` folder is authoritative over any prior chat explanation.
