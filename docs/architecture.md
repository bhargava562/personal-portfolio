# Architecture Documentation

## Target Architecture

```
                                  [Content Updates (Supabase / SQL / CMS)]
                                                       │
                                                       ▼
                                          ┌────────────────────────┐
                                          │   PostgreSQL Database  │
                                          │       (Supabase)       │
                                          └────────────┬───────────┘
                                                       │ DB Change Trigger / Webhook
                                                       ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                    Cloudflare Workers Edge Network                      │
 │                                                                         │
 │   ┌────────────────────────┐          Writes        ┌───────────────┐   │
 │   │    apps/api (Hono)     │───────────────────────▶│  Workers KV   │   │
 │   │  - Sync Service        │                        │(PORTFOLIO_KV) │   │
 │   │  - Tokenized links     │                        │- Pre-built    │   │
 │   │  - View analytics      │                        │  metadata JSON│   │
 │   └──────────┬─────────────┘                        └───────┬───────┘   │
 │              │                                              │           │
 │              │ Dynamic interactions                         │ Reads     │
 │              ▼                                              ▼           │
 │   ┌─────────────────────────────────┐        ┌──────────────────────┐   │
 │   │     End User (Any Browser)      │───────▶│   apps/web (Astro)   │   │
 │   │  - Semantic HTML + Plain CSS    │        │ - @astrojs/cloudflare│   │
 │   │  - Zero DB queries per visit    │        │ - Direct KV reads    │   │
 │   │  - Islands (Preact) only for UI │        │ - Sub-ms edge cache  │   │
 │   └─────────────────────────────────┘        └──────────────────────┘   │
 └─────────────────────────────────────┬───────────────────────────────────┘
                                       │
                                       ▼
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

# ADR-001: Cloudflare Workers and Workers KV for Edge Hosting & Content Sync

> Full ADR document: [`docs/adr/001-cloudflare-workers-and-kv.md`](./adr/001-cloudflare-workers-and-kv.md)

**Status:** Accepted  
**Date:** 2026-11-22  
**Deciders:** Bhargava A  

## Context
The stack chosen (Astro, Hono API, Postgres) was selected for cross-browser resilience, minimal-JS execution, and instant page loads. A core requirement is: **inserting or updating a row in Postgres must update the live portfolio without code commits, manual redeployments, or long full-rebuild cycles, while maintaining zero per-visitor database queries.**

Earlier designs relied on Vercel Deploy Hooks triggering static site rebuilds (~30–60s). This consumed Vercel build minutes and incurred rebuild latency on every content edit.

## Decision
Deploy exclusively to **Cloudflare Workers** using **Cloudflare Workers KV** (`PORTFOLIO_KV`) as the edge caching and pre-built metadata layer:
1. `apps/web` runs on Cloudflare Workers via `@astrojs/cloudflare`. It reads metadata JSON directly from `PORTFOLIO_KV` bindings with sub-millisecond edge latency, achieving zero database queries per visitor.
2. `apps/api` runs on Cloudflare Workers using Hono as an edge sync service. Supabase database change triggers/webhooks hit `apps/api`, which updates the pre-built metadata JSON stored in `PORTFOLIO_KV`.
3. Visiting the portfolio incurs 0 database queries, protecting free-tier Postgres instances from sleeping or connection exhaustion.

```
INSERT INTO projects (...)
        │
        ▼
Postgres Webhook / Trigger (fires on INSERT/UPDATE)
        │  HTTP POST
        ▼
apps/api on Cloudflare Workers (Hono sync endpoint)
        │
        ▼
Updates PORTFOLIO_KV binding with pre-built metadata JSON
        │
        ▼
apps/web on Cloudflare Workers reads PORTFOLIO_KV on request
        │
        ▼
New content live instantly at the edge
```

## Related Documentation & ADRs
- [ADR-001: Cloudflare Workers and Workers KV](docs/adr/001-cloudflare-workers-and-kv.md)
- [ADR-002: Supabase Database Connection Method & Security Architecture](docs/adr/002-supabase-database-connection.md)
- [Architectural Pattern: Ports and Adapters (Hexagonal Architecture)](docs/architecture/ports-and-adapters.md)

## Options Considered

### Option A: SSR with Direct Database Queries
- **Trade-off:** Visiting the site always hits the database. On free-tier databases (e.g. Supabase, Neon), a sleeping database will crash or freeze visitor page loads. Incurs high database read costs.
- **Verdict:** Rejected.

### Option B: Database Webhook → Full Rebuilds (Vercel Deploy Hook)
- **Trade-off:** 30–60 second build delays, burns build minutes, fragments deployment platforms.
- **Verdict:** Superseded by Option C.

### Option C: Cloudflare Workers + Shared Workers KV (`PORTFOLIO_KV`) (Chosen)
- **Trade-off:** Eventual consistency across global KV nodes (typically propagates within seconds).
- **Benefits:** Instant updates, zero database load per visitor, unified Cloudflare runtime, zero cold starts, generous free tier.
- **Verdict:** Accepted.

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

| Component | Supabase Setup | Neon / Generic Postgres Migration |
|---|---|---|
| `packages/data-access` | Uses `@supabase/supabase-js` internally | Replace internals with `pg` or `@neondatabase/serverless`; keep exported function signatures identical |
| `apps/web` | Calls `@portfolio/data-access` or reads `PORTFOLIO_KV` | Zero changes |
| `apps/api` | Calls `@portfolio/data-access` | Zero changes |
| `packages/shared` | Pure Zod schemas & types | Zero changes |
| Schema & SQL | Standard PostgreSQL DDL | Run identical SQL via `pg_dump`/`psql` |
| Webhook / Sync Trigger | Supabase Database Webhook to `apps/api` | Postgres trigger calling `pg_net` or webhook targeting `apps/api` sync endpoint on Cloudflare Workers |
| Caching | Cloudflare Workers KV (`PORTFOLIO_KV`) | Cloudflare Workers KV (`PORTFOLIO_KV`) |
