# ADR-002: Supabase Database Connection Method & Security Architecture

**Status:** Accepted  
**Date:** 2026-11-22  
**Deciders:** Bhargava A  

---

## 1. Context

In the personal portfolio monorepo architecture established by ADR-001, the system separates content authoring from content consumption:
1. **Source of Truth:** PostgreSQL hosted on Supabase, edited by the portfolio owner.
2. **Synchronization Service (`apps/api`):** Hono running on Cloudflare Workers, triggered by database webhooks on content changes.
3. **Edge Cache:** Cloudflare Workers KV (`PORTFOLIO_KV`), holding pre-built metadata JSON.
4. **Visitor Frontend (`apps/web`):** Astro running on Cloudflare Workers, serving visitors directly from `PORTFOLIO_KV` with zero database round-trips.

This decision record establishes the exact connection protocol, authentication mechanism, and security posture for interfacing the Hono backend on Cloudflare Workers with Supabase.

---

## 2. Decision

We connect the Hono synchronization worker to Supabase exclusively via **Supabase Project URL + API Key over HTTPS (`@supabase/supabase-js`)**, utilizing the modern **Secret Key (`sb_secret_...`)**:

```
[Supabase Database]
        ▲
        │ HTTPS REST / PostgREST (URL + sb_secret_...)
        ▼
[apps/api (Hono on Cloudflare Workers)]
        │
        │ Compiles & Writes JSON Snapshot
        ▼
[Cloudflare Workers KV (PORTFOLIO_KV)]
        ▲
        │ Reads Pre-built JSON (0 DB Queries)
        │
[apps/web (Astro on Cloudflare Workers)] ──▶ [End Visitors]
```

---

## 3. Detailed Rationale

### 3.1 Why URL + API Key (`@supabase/supabase-js`) Wins Here

1. **Zero Connection Pooling Headaches on Serverless Workers:**
   Traditional database drivers establish stateful TCP sockets. In serverless edge environments (Cloudflare Workers, V8 isolates), rapid worker instantiation and teardown quickly exhausts Postgres connection limits (`max_connections`). In contrast, `@supabase/supabase-js` communicates over standard stateless HTTPS requests (PostgREST), which Cloudflare Workers execute natively with zero socket leaks.
2. **Native Environment Support (No Extra Drivers or Compatibility Flags):**
   HTTP communication works out of the box without requiring specialized Node.js polyfills, raw TCP shims, ORMs (Prisma, Drizzle), or native driver binaries.
3. **Low-Frequency Background Workload:**
   Visitors never query the database directly. The Hono backend only queries Supabase when the owner updates portfolio content (infrequent background sync). Saving 10–20ms of connection overhead on a background job does not justify the complexity of managing connection pools.

### 3.2 Why the New Secret Key (`sb_secret_...`) Is Used

Supabase is deprecating legacy `anon` and `service_role` JWT keys by the end of 2026 in favor of **Publishable (`sb_publishable_...`)** and **Secret (`sb_secret_...`)** keys:

1. **Built for Private Server-Side Sync:**
   The Hono sync worker runs privately on Cloudflare Workers servers, never in a visitor's browser. The Secret Key (`sb_secret_...`) bypasses Row Level Security (RLS) internally, allowing the sync service to read all portfolio, project, profile, and analytics tables cleanly without needing permissive public read rules.
2. **Automatic Browser Protection:**
   Supabase enforces strict client guards: if an `sb_secret_...` key is ever accidentally leaked or requested from a browser, Supabase automatically rejects the request with `401 Unauthorized`.
3. **Granular Service Rotation:**
   Dedicated secret keys can be minted specifically for `hono-sync-worker`, allowing independent rotation or revocation without invalidating other project tooling.
4. **Strict Key Isolation:**
   The Secret Key is stored exclusively in `apps/api/.dev.vars` (gitignored) for local development and in Cloudflare Workers secrets via `wrangler secret put SUPABASE_SECRET_KEY` for production. It is never included in `apps/web` or any client-exposed `PUBLIC_` variables.

### 3.3 Why Direct Connections (Port 5432) and Connection Poolers (Port 6543) Are Overhead Here

| Connection Method | Best For | Verdict for This Portfolio |
|---|---|---|
| **URL + Secret Key (`@supabase/supabase-js` over HTTPS)** | Cloudflare Workers, Edge APIs, low-frequency sync pipelines | **Selected.** Zero pool management, native HTTPS, robust on edge runtimes. |
| **Connection Pooler (Supavisor / Port 6543) or Cloudflare Hyperdrive** | Serverless backends running heavy, continuous ORM/SQL traffic (Prisma, Drizzle) on every visitor request | **Overkill.** Visitors read from KV; no per-visitor database calls exist. |
| **Direct Connection String (Port 5432)** | Long-running server processes (Docker, VMs), CLI database migrations (`supabase db push`) | **Avoid in Workers.** Causes connection pool exhaustion; requires dedicated IPv6 routing. |

### 3.4 Why Supabase Is Preferred Over Neon for This System

1. **Built-in Table Editor (Zero-Maintenance Headless CMS):**
   Supabase provides an integrated, intuitive spreadsheet-style table editor in the dashboard. The portfolio owner updates projects, skills, and experiences directly without needing a custom admin panel or local SQL scripts.
2. **Built-in Database Webhooks:**
   Supabase natively emits HTTP webhooks on row `INSERT`, `UPDATE`, or `DELETE`, triggering the Hono `POST /sync` worker endpoint automatically.
3. **Resilient to Free-Tier Inactivity Pausing:**
   Supabase free tier pauses databases after 7 days of inactivity. Because visitors are served exclusively from Cloudflare Workers KV, **the portfolio stays 100% online, ultra-fast, and uninterrupted even when the database is sleeping**. The database is only awakened when the owner logs in to edit content.

---

## 4. Strict Security Baseline (Late 2026 Supabase Hardening)

To ensure cloud data remains locked down, the database adheres to a default-deny defense-in-depth model:

1. **Enable RLS on Every Table with Zero Public Policies:**
   All tables in the `public` schema (`profile`, `projects`, `resume`, `analytics`) must have Row Level Security enabled:
   ```sql
   ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.resume ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
   ```
   With zero policies added for `anon` or `authenticated`, RLS acts as a default-deny firewall. Public clients cannot read or write any rows. The Hono sync worker using `sb_secret_...` bypasses RLS cleanly.

2. **Revoke Default Table Grants from Public Roles:**
   Defense-in-depth at the Postgres permission layer:
   ```sql
   REVOKE ALL ON TABLE public.profile, public.projects, public.resume, public.analytics FROM anon, authenticated;
   ```

3. **RLS Verification Audit:**
   Any schema migration must pass the RLS coverage audit query:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND rowsecurity = false;
   ```
   This query must always return 0 rows.

4. **Securing Database Webhooks:**
   Webhooks sent from Supabase to `apps/api` `/sync` must include a shared authorization header (`Authorization: Bearer <SYNC_SECRET>`), verified via constant-time comparison (`timingSafeEqual`) in Hono before any sync execution.

5. **Storage Bucket Rules:**
   Public buckets are reserved solely for public static assets (e.g., project thumbnails). Any sensitive files must reside in private buckets guarded by explicit RLS on `storage.objects`.

6. **Reproducible Migration Files:**
   All DDL, RLS enablement, and grant revocations are stored as version-controlled `.sql` files in `supabase/migrations/` rather than manual dashboard mutations.

---

## 5. Consequences

### Positive
- Zero database connection exhaustion issues on Cloudflare Workers.
- Absolute isolation between public visitors and primary database.
- Maximum security posture with default-deny RLS and revoked public grants.
- 100% free-tier sustainability with zero downtime during database sleep periods.

### Negative / Trade-offs
- Modifying schema requires authoring migration SQL files and maintaining Zod mapping in the repository adapter.
