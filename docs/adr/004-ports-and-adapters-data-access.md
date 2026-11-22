# ADR-004: Ports and Adapters (Hexagonal Architecture) for Loose Coupling and Database Swappability

## Status
Accepted

## Context
In our system architecture, Hono on Cloudflare Workers (`apps/api`) acts as an edge synchronization pipeline that reads content from a primary database (Supabase), compiles it into validated domain schemas (`@portfolio/shared`), and writes it to an edge cache (Cloudflare Workers KV).

If `apps/api` directly imported `@supabase/supabase-js` or Cloudflare KV SDK types:
1. **Tight Vendor Coupling:** Migrating the database (e.g., from Supabase to Neon, Turso, or standard Postgres) or changing the cache store would require modifying API routes, service classes, and data transformations.
2. **Leaky Database Schemas:** Database column naming conventions (`snake_case`) would leak into high-level business logic and API endpoints.
3. **Difficult Local Testing:** Unit testing the sync workflow would require spinning up live database instances or heavy cloud emulators rather than running fast in-memory tests.

We need an architectural pattern that guarantees total decoupling between application logic and third-party database/cache vendors.

---

## Decision
Adopt **Ports and Adapters (Hexagonal Architecture)** backed by the **Dependency Inversion Principle (DIP)** and the **Repository Pattern**:

1. **High-Level Domain Services Depend Strictly on Abstractions (Ports):**
   - High-level business logic (`SyncService` in `apps/api/src/services/sync.service.ts`) and Hono routes depend exclusively on TypeScript interfaces defined in `packages/data-access/src/ports/`:
     - `PortfolioRepository`: Defines domain queries (`getProfile()`, `getProjects()`, `getResume()`).
     - `CacheStore`: Defines key-value storage contracts (`get<T>()`, `set<T>()`).
2. **Concrete SDKs Confined to Adapters:**
   - Concrete implementations reside strictly inside `packages/data-access/src/adapters/`:
     - `adapters/supabase/portfolio.repository.ts`: The **only** file importing `@supabase/supabase-js`.
     - `adapters/cloudflare/kv-cache.store.ts`: The **only** file importing Cloudflare KV types.
3. **Data Mapping at the Adapter Boundary:**
   - The Supabase adapter transforms database-specific `snake_case` rows into clean, camelCase domain types validated against Zod schemas (`packages/shared/src/schemas.ts`) before returning them to callers.
4. **Composition Root / Dependency Injection (`apps/api/src/container.ts`):**
   - A single factory function at the edge application bootstrap reads environment bindings (`c.env`), instantiates the concrete adapters, and injects them into `SyncService`. Swapping databases requires changing **one line** in this file.

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

## Alternatives Considered

| Alternative | Why It Was Rejected |
| :--- | :--- |
| **Direct SDK Imports in Routes (`@supabase/supabase-js` inside Hono routes)** | Spreads vendor-specific code across application endpoints. Any database change requires refactoring routes and tests. |
| **Heavy Dependency Injection Framework (InversifyJS, TSyringe)** | Adds unnecessary runtime bloat, decorators, and metadata reflection overhead that degrades edge cold-start performance on Cloudflare Workers. |
| **Active Record / Fat ORM Models (Prisma, TypeORM)** | Couples data access to stateful connection pools and bulky generated engines unsuitable for lightweight serverless Workers. |
| **Ports and Adapters with Lightweight Factory (Chosen)** | Zero runtime performance penalty, pure TypeScript type-safety, completely swappable adapters, and instantaneous local unit testing with in-memory fakes. |

---

## Consequences

### Positive
- **Vendor Independence:** Migrating from Supabase to Neon, Turso, or raw PostgreSQL requires authoring a single adapter file in `packages/data-access/src/adapters/` and changing one constructor call in `apps/api/src/container.ts`. Zero changes are required in Hono routes or sync logic.
- **Leaky Abstraction Prevention:** Database schema quirks, nullability handling, and column naming differences never escape the adapter layer.
- **Fast Unit Testing:** Services can be tested in milliseconds using simple in-memory mock repositories without requiring network access, Docker, or live Supabase credentials.

### Trade-offs
- **Indirection:** Developers must maintain interfaces (`ports/`) alongside concrete classes (`adapters/`), requiring discipline when adding new domain operations.
