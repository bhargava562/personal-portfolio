# Architecture Documentation

## Target Architecture

```
                                  [Content Updates (Table Editor / SQL / CMS)]
                                                       │
                                                       ▼
                                          ┌────────────────────────┐
                                          │   PostgreSQL Database  │
                                          │ (Supabase, Neon, etc.) │
                                          └────────────┬───────────┘
                                                       │ DB Change Trigger / Webhook
                                                       ▼
                                          ┌────────────────────────┐
                                          │   Vercel Deploy Hook   │
                                          └────────────┬───────────┘
                                                       │ Triggers Rebuild (~30-60s)
                                                       ▼
┌─────────────────────────────────┐       ┌────────────────────────┐
│     End User (Any Browser)      │──────▶│ apps/web (Astro CDN)   │
│  - Static HTML + Plain CSS      │       │ - Static Output        │
│  - Zero DB queries per visit    │       │ - Calls data-access    │
│  - Islands (Preact) only for UI │       │   at build time        │
└────────────────┬────────────────┘       └────────────┬───────────┘
                 │ Dynamic interactions                │
                 ▼                                     │
      ┌───────────────────────┐                        │
      │   apps/api (Hono)     │                        │
      │  - Vercel Serverless  │                        │
      │  - Tokenized links    │                        │
      │  - View analytics     │                        │
      └──────────┬────────────┘                        │
                 │                                     │
                 ▼                                     ▼
      ┌────────────────────────────────────────────────────────────┐
      │                   packages/data-access                     │
      │  - Sole place importing database driver / client library   │
      │  - Exports typed repository functions                      │
      │  - Loosely coupled: provider swappable with zero changes   │
      │    to apps/web or apps/api                                 │
      └────────────────────────────┬───────────────────────────────┘
                                   │ Uses types/schemas
                                   ▼
      ┌────────────────────────────────────────────────────────────┐
      │                      packages/shared                       │
      │  - Provider-agnostic Zod schemas & TypeScript types        │
      └────────────────────────────────────────────────────────────┘
```

---

# ADR-001: Content Update Mechanism for Static Portfolio

**Status:** Accepted  
**Date:** 2026-10-11  
**Deciders:** Bhargava A  

## Context
The stack chosen (Astro static output, Hono API, Postgres) was selected for cross-browser resilience, minimal-JS execution, and instant page loads. A core requirement is: **inserting or updating a row in Postgres must update the live portfolio without code commits or manual redeployments.**

Astro's `output: "static"` reads the database only at build time. To keep the static guarantee without per-visitor database round-trips, builds must be triggered automatically whenever content changes.

## Decision
Keep Astro static output (avoid SSR per-request database hits). Trigger a rebuild via a database webhook/trigger that sends an HTTP POST request to a Vercel Deploy Hook URL.

```
INSERT INTO projects (...)
        │
        ▼
Postgres Webhook / Trigger (fires on INSERT/UPDATE)
        │  HTTP POST
        ▼
Vercel Deploy Hook URL (no code, no secrets exposed)
        │
        ▼
Vercel rebuilds apps/web → Astro re-reads database at build time → redeploys to CDN
        │
        ▼
New content live, typically under 60 seconds
```

## Options Considered

### Option A: SSR (Render on every request)
- **Trade-off:** Visiting the site always hits the database. On free-tier databases (e.g. Supabase, Neon), a sleeping database will crash or freeze visitor page loads. Incurs high database read costs.
- **Verdict:** Rejected.

### Option B: Database Webhook → Vercel Deploy Hook (Chosen)
- **Trade-off:** Small delay (~30–60s) between insert and live deployment.
- **Benefits:** Visitors get 100% static HTML. Zero database load per visitor. If the database pauses, the site stays fully functional on the edge CDN.
- **Verdict:** Accepted.

### Option C: Client-side fetch on page load
- **Trade-off:** Requires client-side JavaScript execution to view content, breaking SEO crawlability and cross-browser no-JS resilience.
- **Verdict:** Rejected.

---

# ADR-002: Database Access Abstraction (Preventing Vendor Lock-in)

**Status:** Accepted  
**Date:** 2026-10-11  
**Deciders:** Bhargava A  

## Context
The project initially uses Supabase Postgres, but migration to Neon or vanilla self-hosted PostgreSQL is a planned contingency. Both use standard PostgreSQL SQL. The risk is **vendor-specific client code (`@supabase/supabase-js`) being scattered across `apps/web` and `apps/api`**, which makes provider migration expensive and error-prone.

## Decision
Create a dedicated workspace package, `packages/data-access`, as an isolated **repository layer**.
- `packages/data-access` is the **only** package that imports database client libraries (e.g., `@supabase/supabase-js` or `pg`).
- `apps/web` and `apps/api` only call domain repository functions (e.g., `getProjects()`, `getProfile()`, `recordPageView()`).
- `packages/shared` contains purely provider-agnostic Zod schemas and TypeScript types.
- If migrating to Neon, Drizzle, or raw `pg`, only the internal implementation of `packages/data-access` is updated; calling code in `apps/web` and `apps/api` remains completely untouched.

```
apps/web  ──┐
            ├──► packages/data-access (repository functions)
apps/api  ──┘             │
                           ▼
                  @supabase/supabase-js (today)
                  — or —
                  @neondatabase/serverless / pg (future, one package rewritten)
```

## Loose Coupling Migration Plan

| Component | Supabase Setup (Phase 1–5) | Neon / Generic Postgres Migration |
|---|---|---|
| `packages/data-access` | Uses `@supabase/supabase-js` internally | Replace internals with `pg` or `@neondatabase/serverless`; keep exported function signatures identical |
| `apps/web` | Calls `@portfolio/data-access` | Zero changes |
| `apps/api` | Calls `@portfolio/data-access` | Zero changes |
| `packages/shared` | Pure Zod schemas & types | Zero changes |
| Schema & SQL | Standard PostgreSQL DDL | Run identical SQL via `pg_dump`/`psql` |
| Webhook / Deploy Hook | Supabase Database Webhook | Postgres trigger calling `pg_net` or scheduled GitHub Action/Vercel cron |
| Caching | Static CDN (no Redis/CDC) | Static CDN (no Redis/CDC) |
