# ADR-001: Choose Astro (Frontend) and Hono (Backend) Over Other JS Frameworks

## Status
Accepted

## Context
This project is a personal portfolio designed to be:
- **Ultra-fast and lag-free** on all browsers, including older or low-end mobile devices.
- **Memory-safe and lightweight**, with minimal client-side JavaScript overhead.
- **Content-first** (profile, projects, resume) backed by a small, decoupled backend sync service that updates cached metadata JSON from Supabase.

We need a frontend framework that ships minimal browser code and a backend framework that runs natively on edge runtimes (Cloudflare Workers) without heavy dependencies.

---

## Decision
1. **Frontend:** Use **Astro** (with lightweight **Preact** islands only where interactivity is genuinely needed).
2. **Backend:** Use **Hono** for the sync API (`apps/api`).

---

## Alternatives Considered

### Frontend: Why Astro?

| Alternative | Why It Was Rejected |
| :--- | :--- |
| **Next.js** | App-first, not content-first. Ships a minimum React runtime (~80–120KB gzipped) to the browser for hydration and routing, even on static portfolio pages. Also creates tighter coupling to Vercel. |
| **React (SPA / Vite)** | Renders on the client by default, shipping a full JS bundle before content appears. Hurts initial load speed, SEO, and performance on low-end devices. |
| **Vue / Nuxt** | Similar to React/Next.js—great for interactive web apps, but still ships a full client-side framework runtime and hydration layer that a content-focused portfolio does not need. |
| **Vanilla HTML/CSS/JS** | Maximum raw speed, but painful to maintain at scale: no component reuse, no layouts, no TypeScript/Zod integration, and no built-in asset bundling or optimization. |
| **Astro (Chosen)** | **Ships 0 KB of client-side JavaScript by default.** Compiles pages to plain HTML/CSS with reusable components, TypeScript support, and opt-in "Islands" (Preact) only for interactive widgets. |

### Backend: Why Hono?

| Alternative | Why It Was Rejected |
| :--- | :--- |
| **Express** | Built on legacy Node.js `req/res` APIs, cannot run natively on Cloudflare Workers V8 isolates, slower routing, and weaker native TypeScript support. |
| **Fastify** | Very fast on Node.js, but tightly coupled to the Node.js runtime—not built for edge Workers. |
| **Next.js API Routes** | Ties the backend to the Next.js frontend framework and Node/Vercel conventions instead of keeping a clean, independent sync service. |
| **Hono (Chosen)** | Built on Web Standards (`Request`/`Response`) with zero external dependencies. Runs natively on Cloudflare Workers (and can move to Node, Bun, or Deno with minimal changes), offers first-class TypeScript inference, and includes built-in `secureHeaders`, `cors`, and `csrf` middleware. |

---

## Consequences

### Positive
- **Near-instant loads & low memory usage:** Visitors download plain HTML/CSS instead of heavy JS bundles, keeping the site smooth even on low-RAM phones or browsers with JS disabled.
- **Framework-agnostic future:** Astro lets us drop in Preact, React, or Vue islands later if needed, and Hono's Web Standard APIs avoid runtime lock-in.
- **Clean separation of concerns:** Frontend rendering (`apps/web`) and background DB-to-KV syncing (`apps/api`) stay decoupled in the monorepo.

### Trade-offs
- **Not ideal for heavy client-side apps:** If this project ever turns into a complex, state-heavy SaaS dashboard, a full-stack app framework like Next.js or Nuxt would be a better fit.
- **Two frameworks to configure:** Using Astro + Hono requires wiring two workspace apps instead of one monolith, mitigated by our `pnpm` monorepo and shared packages (`packages/shared`, `packages/data-access`).
