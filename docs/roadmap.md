# Project Roadmap & Phased Execution Plan

## Execution Rule
**Strict Phase-by-Phase Delivery:** Do not scaffold multiple phases at once. Each phase must produce a verified, runnable, or deployed deliverable before the next phase begins.

---

## Phase Checklist

- [x] **Phase 0: Repo Skeleton & Authoritative Documentation** *(Completed)*
  - Create directory skeleton (`apps/`, `packages/`, `supabase/`, `docs/`).
  - Establish durable ground truth: `AGENTS.md`, `CLAUDE.md`, `docs/requirements.md` (with browser tiers), `docs/architecture.md` (with ADR-001 & ADR-002), `docs/tech-stack.md`, `docs/roadmap.md`.
  - Commit to version control as the documentation baseline.

- [x] **Phase 1: Workspace & Tooling Foundation & Architecture Realignment** *(Completed)*
  - Configure `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
  - Configure `.gitignore` and `tsconfig.base.json` (strict TypeScript baseline).
  - Setup root `package.json` with workspace scripts (`dev:web`, `dev:api`, `build:web`, `build:api`, `typecheck`, `lint`).
  - Align architecture to Cloudflare Workers ONLY: Astro with `@astrojs/cloudflare`, Hono on Cloudflare Workers sync service, shared `PORTFOLIO_KV` binding, and author `docs/adr/001-cloudflare-workers-and-kv.md`.
  - *Verification:* Root `pnpm install` and workspace scripts successfully validated; docs aligned.

- [x] **Phase 2: Shared Schemas & Stubbed Data-Access** *(Completed)*
  - Initialize `packages/shared`: Pure Zod schemas and TypeScript domain types (100% provider-agnostic). Point `main`/`types` to `./src/index.ts`.
  - Initialize `packages/data-access`: Repository layer with STUBBED data functions matching Zod types (`getProjects`, `getProfile`, `getResumeData`, `recordPageView`).
  - Packages extend `tsconfig.base.json`.
  - *Verification:* `pnpm -r typecheck` passes cleanly across workspace with zero errors.

- [ ] **Phase 3: Astro Frontend (`apps/web`)**
  - [x] **Step 3a:** Astro scaffold, Preact integration, `@portfolio/data-access` stub consumption on homepage, and verified static build output.
  - [x] **Step 3b:** Resume page (`/resume`) with dedicated layout, content sections, and printable stylesheet (`@media print`), verified build (`dist/resume/index.html`).
  - [ ] **Step 3c:** Interactive Preact islands (resume viewer toolbar with zoom/actions, command palette).
  - [ ] **Step 3d:** Cloudflare Workers deployment via `@astrojs/cloudflare` and `PORTFOLIO_KV` binding verification.
  - *Verification:* `pnpm build:web` produces Cloudflare Workers bundle / static assets; confirmed before Phase 4.

- [ ] **Phase 4: Hono API Backend (`apps/api`)**
  - Initialize Hono application for Cloudflare Workers runtime (`wrangler` configuration).
  - Bind shared `PORTFOLIO_KV` KV namespace to `apps/api`.
  - Wire `/api/health`, `/api/sync` (sync service from Supabase to KV), and auxiliary endpoints (tokenized links, view analytics).
  - Deploy to Cloudflare Workers via Wrangler.
  - *Verification:* Visit `<api-url>/api/health` and verify `{"ok":true}` live response.

- [ ] **Phase 5: Postgres Database & Migrations**
  - Initialize Supabase in `supabase/` (`supabase init`).
  - Author SQL migrations for content tables (`projects`, `skills`, `experiences`, `profiles`) and dynamic tables (`resume_tokens`, `page_analytics`).
  - Define RLS policies (public read for content, service-role for API sync service).
  - Generate TypeScript database types into `packages/data-access`.
  - Swap repository stubs for real Supabase queries inside `packages/data-access`. Calling code in `apps/web` and `apps/api` remains completely untouched!
  - *Verification:* Local and live sync succeeds with live database data.

- [ ] **Phase 6: Automated Content Sync Pipeline (ADR-001)**
  - Configure Supabase Database Webhook (or Postgres trigger) on content table changes targeting `apps/api` `/api/sync` endpoint.
  - Authenticate webhook via shared webhook secret.
  - `apps/api` compiles pre-built metadata JSON from Supabase via `packages/data-access` and updates `PORTFOLIO_KV`.
  - *Verification:* Insert a row in Supabase table editor $\rightarrow$ webhook triggers `apps/api` $\rightarrow$ `PORTFOLIO_KV` updated $\rightarrow$ site reflects update instantly at the edge with zero code commits or rebuilds.

- [ ] **Phase 7: CI/CD, PDF Resume Generation & Quality Gates**
  - Create GitHub Actions workflow (`.github/workflows/ci.yml`).
  - Implement Playwright headless task to render `/resume` and compile `Bhargava_Resume.pdf`.
  - Configure Lighthouse CI assertions ensuring scores > 95 for Performance, Accessibility, Best Practices, and SEO.
  - Configure Wrangler deployment action for Cloudflare Workers.
  - *Verification:* CI runs end-to-end on git push and generates the downloadable PDF resume asset.
