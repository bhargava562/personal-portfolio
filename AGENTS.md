# AGENTS.md — Operating Rules for AI Agents in This Repo

## Non-negotiable architecture rules

1. **Deployment Platform (Cloudflare Workers ONLY):**
   Deployments target Cloudflare Workers exclusively via Wrangler. No Vercel or other hosting platforms are used (ADR-002).
2. **Monorepo Structure & Separation of Concerns:**
   - `apps/web`: Astro frontend deployed to Cloudflare Workers (`@astrojs/cloudflare`), reading pre-built metadata JSON directly from `PORTFOLIO_KV` (ADR-001 & ADR-002).
   - `apps/api`: Hono backend deployed to Cloudflare Workers, acting as an edge sync service from Supabase to KV, plus tokenized links and view analytics (ADR-001, ADR-002, ADR-003).
   - `packages/data-access`: Dedicated repository layer. The ONLY package permitted to import `@supabase/supabase-js` or any direct database driver (ADR-004).
   - `packages/shared`: Pure, provider-agnostic Zod schemas and TypeScript domain types (ADR-004).
3. **Database Access Abstraction (ADR-004):**
   Only `packages/data-access` may import `@supabase/supabase-js` or database drivers. `apps/web` and `apps/api` must call repository functions exported by `@portfolio/data-access`. The app layer must remain completely decoupled from any specific database vendor.
4. **Zero DB Reads Per Visitor (ADR-002):**
   `apps/web` reads metadata JSON directly from the shared Cloudflare Workers KV binding (`PORTFOLIO_KV`). Visiting the website costs 0 database queries. Never introduce per-request database calls to PostgreSQL for page visitors.
5. **Automated Content Sync Pipeline (ADR-002 & ADR-003):**
   Content updates happen via database change trigger/webhook $\rightarrow$ `apps/api` (Hono on Cloudflare Workers) $\rightarrow$ updates `PORTFOLIO_KV`. Never build a "redeploy manually to update content" workflow.
6. **No Over-Engineered Caching Layers:**
   Do not introduce Redis, Debezium CDC, or complex edge-cache-tag infrastructure unless a new ADR justifies it against real traffic metrics. Cloudflare Workers KV (`PORTFOLIO_KV`) serves as the edge store.
7. **Cross-Browser Baseline:**
   Review `docs/requirements.md` browser support policy before choosing any CSS or JS feature. Plain CSS with semantic HTML must render all core content even with JavaScript disabled.
8. **No All-at-Once Scaffolding:**
   Follow `docs/roadmap.md` strictly in sequential phases. Complete and verify each phase before moving to the next.
9. **Supabase Strict Security Baseline (Late 2026 Guidance):**
   - **Default-Deny RLS on Every Table:** Every table created in `public` must have Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) with zero public policies. This default-deny firewall completely blocks public access via the Data API, while allowing the Hono sync worker using the dedicated Secret Key (`sb_secret_...`) to read/sync safely.
   - **Revoke Public Grants:** Explicitly revoke default table grants from client roles: `REVOKE ALL ON TABLE ... FROM anon, authenticated;`.
   - **API Key Hygiene:** Use the dedicated Secret Key (`sb_secret_...`) strictly server-side in `apps/api/.dev.vars` (local) and via `wrangler secret put SUPABASE_SECRET_KEY` (production). Never place it in `apps/web` or any client/public environment variable.
   - **RLS Audit Verification:** Verify RLS coverage with:
     `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;` (must return 0 rows).
   - **Storage & Webhook Security:** Storage buckets default to private (with explicit RLS). Database webhooks to Hono must include `Authorization: Bearer <SYNC_SECRET>`.
   - **Reproducible Migrations:** All schema changes must be committed as version-controlled `.sql` files in `supabase/migrations/`.
10. **Ports & Adapters (Hexagonal Architecture) & SOLID DIP:**
    - High-level domain services (`apps/api/src/services/sync.service.ts`) and routes must depend only on TypeScript interfaces/ports (`PortfolioRepository`, `CacheStore`) defined in `packages/data-access/src/ports/`.
    - Only concrete adapters (`packages/data-access/src/adapters/`) may import `@supabase/supabase-js` or Cloudflare KV bindings.
    - Database column names (`snake_case`) must be transformed into clean domain types (`camelCase`) inside the adapter.
    - Application entry points (`apps/api/src/container.ts`) wire concrete adapters via lightweight constructor injection.

## Before making changes
- Read `docs/architecture.md`, `docs/adr/001-astro-and-hono-stack.md`, `docs/adr/002-cloudflare-workers-and-kv.md`, `docs/adr/003-supabase-http-api-and-secret-key.md`, `docs/adr/004-ports-and-adapters-data-access.md`, and `docs/tech-stack.md` first.
- Check `docs/roadmap.md` for current phase — do not implement a later phase early.

## Current Status & Checkpoint
- **Completed:**
  - Phase 0: Repo Skeleton & Authoritative Documentation.
  - Phase 1: Documentation Alignment & ADR Suite (`001-astro-and-hono-stack.md`, `002-cloudflare-workers-and-kv.md`, `003-supabase-http-api-and-secret-key.md`, `004-ports-and-adapters-data-access.md`).
  - Phase 2: Shared schemas (`packages/shared`) & stubbed data-access (`packages/data-access`).
  - Phase 3: Astro frontend (`apps/web`) configured for Cloudflare Workers with `@astrojs/cloudflare` adapter, `wrangler.jsonc` (`PORTFOLIO_KV` binding), intentional architectural frontend design, and verified production builds.
  - Phase 4: Hono Sync Backend (`apps/api`) scaffolded with Cloudflare Workers types, `wrangler.jsonc`, `PORTFOLIO_KV` bindings, health/sync endpoints, and verified typechecking.
  - Phase 6: Dependency Inspection & LTS Alignment (Node >=26 engines, pnpm 12.21.0, CI Node 26, TypeScript standardized to 7.0.2 across all packages, upgraded wrangler, hono, and patched sub-dependencies via workspace overrides).
  - Phase 7: Baseline Security Hardening (Global secureHeaders, CSRF, and CORS origin allowlists on `apps/api`; `POST /sync` secret authentication; Astro `security: { checkOrigin: true }`; dynamic URL validation and dangerous scheme rejection).
  - Code Review & Remediation (CodeRabbit): Fixed CORS/CSRF domain suffix bypass vulnerability, added constant-time `timingSafeEqual` via Web Crypto on `POST /sync`, patched protocol-relative URL bypass in `sanitizeUrl`, added `pnpm build` to CI workflow, and migrated inline event listener to script block for strict CSP compatibility.
  - Supabase Foundations & ADRs: Established connection configuration via `.env`, `.env.example`, `apps/api/.dev.vars`, `apps/api/.dev.vars.example` (with strict `.gitignore` rules); authored ADRs `001` through `004` and Ports & Adapters guide; verified live connection to `personal-portfolio` (`eqwajpmzlpnwyuegcykc`, `ACTIVE_HEALTHY`) via Supabase MCP; initialized `supabase/migrations/`.
  - Traditional & AI SEO (GEO/AEO): Configured `@astrojs/sitemap` in `apps/web/astro.config.mjs` (`sitemap-index.xml`, `trailingSlash: 'never'`, `devToolbar: { enabled: false }`); authored `apps/web/public/robots.txt` allowing modern AI agents (SearchGPT, Claude, Perplexity, Applebot) and `apps/web/public/llms.txt`; built reusable, XSS-safe `apps/web/src/components/SEOHead.astro` with Schema.org `ProfilePage` + `Person` JSON-LD; integrated `SEOHead` across `/` and `/resume`; authored technical guide `docs/seo-guide.md`.
- **Active / Next:** Phase 5 — Awaiting user command on database ERD schema before authoring migration SQL files and implementing repository adapters.

## Source of truth
- This repository's `docs/` folder is authoritative over any prior chat explanation.

## Database Rollout & SQL Writing Rules

### Rollout Strategy (One Table at a Time)
- **Target Model (Option B):** Pragmatic relational tables with `text[]` arrays where appropriate; text and URLs only first, with images/icons deferred.
- **Incremental Execution:** Roll out **one table at a time**, seed/insert real data right away, and verify it live in Supabase before moving to the next table. Always pause for user validation before starting the next table.
- **GitHub vs. Postgres Execution:** Pushing `.sql` files to GitHub does **not** execute SQL or commit rows into Supabase. SQL executes against Postgres via the Supabase SQL Editor, CLI, or client.

### Mandatory SQL Query Writing Format
1. **One Table Per Step:** Never create or modify multiple unrelated tables in a single step unless explicitly instructed. Roll out one table, verify it with real data, and wait for confirmation before starting the next.
2. **Strict Separation of Schema vs. Data:**
   - Put **DDL only** (`CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, `ENABLE ROW LEVEL SECURITY`, `REVOKE ALL`) in numbered migration files under `supabase/migrations/` (e.g., `0001_create_profile.sql`).
   - Keep **DML** (`INSERT INTO`, `UPDATE`) separate from schema migration files so content changes do not pollute schema history (and use repeatable/idempotent scripts when saved in the repo).
3. **Mandatory Security Defaults on Every New Table:**
   - Every new table in `public` must explicitly enable Row Level Security (`ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;`) and revoke default privileges from `anon` and `authenticated` (`REVOKE ALL ON TABLE public.<table> FROM anon, authenticated;`) in the same migration that creates the table.
4. **Transactions on Multi-Statement / Multi-Row Writes:**
   - Wrap multi-statement migrations or multi-row `INSERT`/`UPDATE` batches in `BEGIN;` ... `COMMIT;` (with clear constraint checks and `ON CONFLICT` / idempotent handling where applicable) so partial failures roll back cleanly.
5. **Parent-First Foreign Keys & Safe Types:**
   - Use `uuid` primary keys (`default gen_random_uuid()`), lowercase `snake_case` table/column names, `timestamptz` for timestamps, `date` for calendar dates, and `text[]` for simple list fields (such as `tech_stack` or `highlights`).
   - Any child table referencing `profile` must declare `profile_id uuid NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE` and only insert rows pointing to an existing `profile.id`.
6. **Public-Safe (`L0`) & Plain-English Walkthrough:**
   - Only include public-safe (`L0`) portfolio data—never internal notes, drafts, or confidential details.
   - For every SQL query provided, briefly explain *why* each clause/transaction is there so the user can easily validate it before executing.
