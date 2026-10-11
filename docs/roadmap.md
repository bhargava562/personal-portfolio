# Project Roadmap & Phased Execution Plan

## Execution Rule
**Strict Phase-by-Phase Delivery:** Do not scaffold multiple phases at once. Each phase must produce a verified, runnable, or deployed deliverable before the next phase begins.

---

## Phase Checklist

- [x] **Phase 0: Repo Skeleton & Authoritative Documentation** *(Completed)*
  - Create directory skeleton (`apps/`, `packages/`, `supabase/`, `docs/`).
  - Establish durable ground truth: `AGENTS.md`, `CLAUDE.md`, `docs/requirements.md` (with browser tiers), `docs/architecture.md` (with ADR-001 & ADR-002), `docs/tech-stack.md`, `docs/roadmap.md`.
  - Commit to version control as the documentation baseline.

- [x] **Phase 1: Workspace & Tooling Foundation** *(Completed)*
  - Configure `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
  - Configure `.gitignore` and `tsconfig.base.json` (strict TypeScript baseline).
  - Setup root `package.json` with workspace scripts (`typecheck`, `lint`).
  - *Verification:* Root `pnpm install` and workspace scripts successfully validated.

- [ ] **Phase 2: Data Access Abstraction & Shared Schemas**
  - Initialize `packages/shared`: Pure Zod schemas and TypeScript domain types (100% provider-agnostic).
  - Initialize `packages/data-access`: Repository layer encapsulating database queries.
  - Implement swappable repository functions (`getProjects`, `getProfile`, `getResumeData`, `recordPageView`).
  - *Verification:* `pnpm --filter @portfolio/shared build` and `pnpm --filter @portfolio/data-access build` typecheck and pass unit tests.

- [ ] **Phase 3: Astro Frontend (`apps/web`)**
  - Initialize Astro static output (`output: "static"`).
  - Add Preact integration for interactive islands (resume viewer, command palette).
  - Wire build-time data calls through `@portfolio/data-access` (zero DB driver imports).
  - Implement Vanilla CSS design system with fluid typography and `@media print` stylesheet.
  - Deploy to Vercel as `apps/web` project.
  - *Verification:* Public URL serves static HTML with zero visitor database reads; confirm live before touching Phase 4.

- [ ] **Phase 4: Hono API Backend (`apps/api`)**
  - Initialize Hono application with Vercel Serverless Function adapter.
  - Wire routes to `@portfolio/data-access` (tokenized resume validation, analytics ingest, rate limiting).
  - Deploy to Vercel as `apps/api` project.
  - *Verification:* Test endpoints via curl/HTTP client and verify rate limiting.

- [ ] **Phase 5: Postgres Database & Migrations**
  - Initialize Supabase / Postgres migrations in `supabase/migrations/`.
  - Author DDL for content tables (`projects`, `skills`, `experiences`, `profiles`) and dynamic tables (`resume_tokens`, `page_analytics`).
  - Define Row Level Security (RLS) policies: public read for content at build time, service-role for API.
  - Generate TypeScript database types into `packages/data-access`.
  - Seed initial portfolio content.
  - *Verification:* Migration runs cleanly; generated types match Zod schemas.

- [ ] **Phase 6: Automated Content Sync Pipeline (ADR-001)**
  - Configure Vercel Deploy Hook for `apps/web`.
  - Configure Supabase Database Webhook (or Postgres trigger) on content table changes pointing to the Deploy Hook.
  - *Verification:* Insert a row in the database table editor $\rightarrow$ Vercel triggers rebuild $\rightarrow$ site reflects update in ~60 seconds with zero code commits.

- [ ] **Phase 7: CI/CD, PDF Resume Generation & Quality Gates**
  - Create GitHub Actions workflow (`.github/workflows/ci.yml`).
  - Implement Playwright headless task to render `/resume` and compile `Bhargava_Resume.pdf`.
  - Configure Lighthouse CI assertions ensuring scores > 95 for Performance, Accessibility, Best Practices, and SEO.
  - *Verification:* CI runs end-to-end on git push and generates the downloadable PDF resume asset.
