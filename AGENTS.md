# AGENTS.md — Operating Rules for AI Agents in This Repo

## Non-negotiable architecture rules

1. **Database Access Abstraction (ADR-002):**
   Only `packages/data-access` may import `@supabase/supabase-js` or any direct database driver.
   `apps/web` and `apps/api` must call repository functions exported by `@portfolio/data-access`.
   The app layer must remain completely decoupled from any specific database vendor (Supabase, Neon, or vanilla Postgres).
2. **Static-First (Zero DB Reads Per Visitor):**
   `apps/web` uses Astro with `output: "static"`. Never introduce per-request database calls (SSR) for page rendering without a new ADR. Visiting the website costs 0 database queries.
3. **Automated Content Update Pipeline (ADR-001):**
   Content updates happen via database change trigger/webhook → Vercel Deploy Hook.
   Never build a "redeploy manually to update content" workflow.
4. **No Over-Engineered Caching Layers:**
   Do not introduce Redis, Debezium CDC, or complex edge-cache-tag infrastructure unless a new ADR justifies it against real traffic metrics. The static CDN serves as the cache.
5. **Cross-Browser Baseline:**
   Review `docs/requirements.md` browser support policy before choosing any CSS or JS feature.
   Plain CSS with semantic HTML must render all core content even with JavaScript disabled.
6. **No All-at-Once Scaffolding:**
   Follow `docs/roadmap.md` strictly in sequential phases. Complete and verify each phase before moving to the next.

## Before making changes
- Read `docs/architecture.md` and `docs/tech-stack.md` first.
- Check `docs/roadmap.md` for current phase — do not implement a later phase early.

## Current Status & Checkpoint
- **Completed:** Phase 0 (Docs/Skeleton), Phase 1 (Workspace/Tooling), Phase 2 (Shared schemas & stubbed data-access), Step 3a (Astro scaffold + stubbed homepage + verified static build).
- **Active / Next:** Step 3b — Resume page & printable stylesheet (`@media print`).

## Source of truth
- This repository's `docs/` folder is authoritative over any prior chat explanation.
