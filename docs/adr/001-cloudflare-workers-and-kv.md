# ADR-001: Cloudflare Workers and Workers KV for Edge Hosting & Content Sync

**Status:** Accepted  
**Date:** 2026-11-22  
**Deciders:** Bhargava A  

## Context
The portfolio requires:
1. **Zero Database Reads Per Visitor:** Visiting the portfolio must cost 0 queries against the primary PostgreSQL database (Supabase), ensuring resilience against free-tier sleeping/pausing databases and sub-second global response times.
2. **Instant Content Updates:** When content is added or updated in PostgreSQL (Supabase), the live site should reflect changes immediately without requiring manual code commits, dashboard redeployments, or lengthy 30–60 second CI/CD full rebuild cycles.
3. **Free-Tier Sustainability & Unified Architecture:** Hosting and compute should run strictly within generous free tiers without vendor fragmentation across multiple platforms.

Previously, ADR-001 proposed using Vercel Deploy Hooks to trigger full Astro static site rebuilds (~30–60s) on every database change. While this achieved zero database queries per visitor, it consumed build minutes, incurred build latency, and relied on Vercel deployment infrastructure.

## Decision
Migrate hosting and edge infrastructure exclusively to **Cloudflare Workers** using **Cloudflare Workers KV**:
- **Frontend (`apps/web`):** Built with Astro using the `@astrojs/cloudflare` adapter. It reads pre-built metadata JSON directly from a shared Cloudflare Workers KV namespace (`PORTFOLIO_KV`). Every edge request serves instantly from KV with zero database round-trips.
- **Backend (`apps/api`):** Built with Hono running on Cloudflare Workers. It acts as an edge sync service: Supabase database change webhooks/triggers invoke Hono endpoints, which fetch fresh data via `packages/data-access`, compile pre-built metadata JSON schemas, and write them into `PORTFOLIO_KV`. It also serves auxiliary API endpoints (tokenized links, view analytics).
- **Cache Layer:** Cloudflare Workers KV with shared binding `PORTFOLIO_KV` storing pre-built metadata JSON (`projects`, `profile`, `resume`, etc.).
- **Monorepo Layout:**
  - `apps/web` (Astro on Cloudflare Workers)
  - `apps/api` (Hono on Cloudflare Workers)
  - `packages/data-access` (Database driver isolation & repository functions)
  - `packages/shared` (Provider-agnostic Zod schemas & TypeScript types)

```
                            [Content Updates in Supabase]
                                          │
                                          ▼
                               ┌─────────────────────┐
                               │  Postgres Database  │
                               │     (Supabase)      │
                               └──────────┬──────────┘
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
     ┌─────────────────────────────────────────────────────────────┐
     │                    packages/data-access                     │
     │  - Sole place importing database driver / client library    │
     │  - Exports typed repository functions                       │
     │  - Loosely coupled: provider swappable with zero changes    │
     │    to apps/web or apps/api                                  │
     └─────────────────────────────┬───────────────────────────────┘
                                   │ Uses types/schemas
                                   ▼
     ┌─────────────────────────────────────────────────────────────┐
     │                       packages/shared                       │
     │  - Provider-agnostic Zod schemas & TypeScript types         │
     └─────────────────────────────────────────────────────────────┘
```

## Options Considered

### Option A: Vercel Deploy Hook & Full Rebuilds (Superseded ADR-001)
- **Trade-off:** Triggering a full rebuild via Vercel Deploy Hook takes 30–60 seconds, burns Vercel monthly build minutes, and fragments hosting across platforms.
- **Verdict:** Superseded by Cloudflare Workers KV.

### Option B: Per-Request SSR to PostgreSQL
- **Trade-off:** Every visitor request queries the database directly. If Supabase sleeps or pauses on the free tier, visitor requests hang or fail. High latency and connection pool exhaustion risks.
- **Verdict:** Rejected.

### Option C: Cloudflare Workers + Shared Workers KV (`PORTFOLIO_KV`) (Chosen)
- **Trade-off:** Workers KV is eventually consistent (updates propagate globally within 60 seconds, typically within seconds).
- **Benefits:**
  - Instant updates: API writes to KV directly; changes are live immediately without triggering build pipelines.
  - True 0 database queries per visitor: `apps/web` fetches metadata from the edge KV binding.
  - Zero cold starts and unified runtime: Both `apps/web` and `apps/api` share Cloudflare's V8 isolate infrastructure and `wrangler` tooling.
  - Generous free-tier limits: 100,000 requests/day on Cloudflare Workers and 100,000 read operations/day on Workers KV.
- **Verdict:** Accepted.

## Consequences
- All deployments target Cloudflare Workers exclusively via `wrangler` (`apps/web` and `apps/api`).
- Both `apps/web` and `apps/api` bind to `PORTFOLIO_KV`.
- `apps/api` implements a webhook receiver endpoint that invalidates/updates `PORTFOLIO_KV` when Supabase data changes.
- `apps/web` uses `@astrojs/cloudflare` runtime bindings to read JSON directly from `PORTFOLIO_KV`.
- Complete elimination of Vercel configurations and dependencies.
