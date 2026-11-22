# Architectural Pattern: Ports & Adapters (Hexagonal Architecture)

## Overview & Design Objective

To adhere to the **Dependency Inversion Principle (DIP)** and the **Single Responsibility Principle (SRP)**, our monorepo enforces a strict **Ports and Adapters (Hexagonal Architecture)** design pattern across `packages/data-access`, `packages/shared`, and `apps/api`.

The core business logic (such as synchronization, caching, and domain validation) must **never** depend directly on database client libraries (`@supabase/supabase-js`), cloud-specific storage SDKs, or raw database schemas. Instead:
- High-level modules depend on **abstractions (Ports / TypeScript interfaces)**.
- Low-level modules implement those abstractions (**Adapters**).
- A **Composition Root** instantiates the concrete adapters at application bootstrap and injects them into domain services.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              apps/api                                  │
│                                                                        │
│   ┌────────────────────┐                   ┌───────────────────────┐   │
│   │   Hono Route       │ ────────────────▶ │      SyncService      │   │
│   │   (POST /sync)     │                   │  (Pure Domain Logic)  │   │
│   └────────────────────┘                   └───────────┬───────────┘   │
│                                                        │               │
│                        Depends strictly on Interfaces  │               │
└────────────────────────────────────────────────────────┼───────────────┘
                                                         │
                                  ┌──────────────────────┴──────────────────────┐
                                  │                                             │
                                  ▼                                             ▼
                       ┌──────────────────────┐                     ┌──────────────────────┐
                       │  PortfolioRepository │                     │      CacheStore      │
                       │        (Port)        │                     │        (Port)        │
                       └──────────▲───────────┘                     └──────────▲───────────┘
                                  │ Implements                                 │ Implements
                       ┌──────────┴───────────┐                     ┌──────────┴───────────┐
                       │  Supabase Adapter    │                     │  Cloudflare KV       │
                       │  (packages/          │                     │  Adapter             │
                       │   data-access)       │                     │  (packages/          │
                       │                      │                     │   data-access)       │
                       └──────────────────────┘                     └──────────────────────┘
```

---

## The 4 Building Blocks in the Monorepo

### 1. Domain Models (`packages/shared/src/schemas.ts`)
- Pure, database-agnostic domain schemas authored in Zod and exported as TypeScript types (`Profile`, `Project`, `Resume`, `PortfolioSnapshot`).
- **Rule:** Zero database-specific types, SDK references, or ORM annotations exist in this layer.

### 2. Ports / Interfaces (`packages/data-access/src/ports/`)
Ports define *what* operations the application needs, completely independent of *how* they are executed.

```typescript
// packages/data-access/src/ports/portfolio.repository.ts
import type { Profile, Project, Resume } from "@portfolio/shared";

export interface PortfolioRepository {
  getProfile(): Promise<Profile>;
  getProjects(): Promise<Project[]>;
  getResume(): Promise<Resume>;
}
```

```typescript
// packages/data-access/src/ports/cache.store.ts
export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
}
```

### 3. Adapters / Implementations (`packages/data-access/src/adapters/`)
Adapters are the **only** modules permitted to import concrete drivers (such as `@supabase/supabase-js`, `pg`, or `@cloudflare/workers-types`).

- `adapters/supabase/portfolio.repository.ts`:
  Implements `PortfolioRepository` using `@supabase/supabase-js` over HTTPS with `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
- `adapters/cloudflare/kv-cache.store.ts`:
  Implements `CacheStore` using the Cloudflare Workers KV namespace binding (`PORTFOLIO_KV`).
- *Future Swapping:* If the primary database ever migrates to Neon, Turso, or standard Postgres, only a new adapter (e.g. `adapters/neon/portfolio.repository.ts`) is authored. All calling services and routes remain untouched.

### 4. Composition Root (`apps/api/src/container.ts` + Hono Handler)
A single factory function at the edge entry point reads environment bindings (`c.env`), creates concrete adapters, and injects them into the service:

```typescript
// apps/api/src/container.ts
import { SupabasePortfolioRepository, CloudflareKVCacheStore } from "@portfolio/data-access";
import { SyncService } from "./services/sync.service";

export function createSyncService(env: CloudflareBindings): SyncService {
  // Swap ONLY this constructor when changing database or cache providers
  const repo = new SupabasePortfolioRepository(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);
  const cache = new CloudflareKVCacheStore(env.PORTFOLIO_KV);
  return new SyncService(repo, cache);
}
```

---

## Pure Sync Service Implementation

The domain sync service coordinates data compilation without any knowledge of Supabase or Cloudflare KV:

```typescript
// apps/api/src/services/sync.service.ts
import type { PortfolioRepository, CacheStore } from "@portfolio/data-access";
import { PortfolioSnapshotSchema } from "@portfolio/shared";

export class SyncService {
  constructor(
    private readonly repo: PortfolioRepository,
    private readonly cache: CacheStore,
  ) {}

  async syncPortfolio(): Promise<void> {
    const [profile, projects, resume] = await Promise.all([
      this.repo.getProfile(),
      this.repo.getProjects(),
      this.repo.getResume(),
    ]);

    const snapshot = PortfolioSnapshotSchema.parse({ profile, projects, resume });
    await this.cache.set("portfolio:snapshot", snapshot);
  }
}
```

And in the Hono route (`apps/api/src/index.ts`):
```typescript
app.post("/sync", async (c) => {
  const syncService = createSyncService(c.env);
  await syncService.syncPortfolio();
  return c.json({ status: "synced", timestamp: new Date().toISOString() });
});
```

---

## 3 Non-Negotiable Rules

1. **Strict Import Boundary:**
   `apps/api/src/routes` and `apps/api/src/services` may **only** import domain ports (`PortfolioRepository`, `CacheStore`) and shared schemas (`@portfolio/shared`). They must never import `@supabase/supabase-js`.
2. **Column Mapping Encapsulated in the Adapter:**
   PostgreSQL `snake_case` database columns must be validated and transformed into clean `camelCase` domain types *inside* the adapter using Zod schemas before being returned. Supabase's internal schema never leaks into application code.
3. **Frictionless Unit Testing:**
   Because `SyncService` depends purely on TypeScript interfaces, it can be thoroughly unit-tested locally using 10-line in-memory fake repositories and caches without connecting to Supabase or spinning up miniflare/KV.
