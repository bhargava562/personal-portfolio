# CLAUDE.md

See `AGENTS.md` for architecture rules — they apply here unchanged.

## Working style for this repo
- **Learning-first:** Explain *why*, not just paste code — Bhargava is learning this stack.
- **Build in phases:** Strictly adhere to `docs/roadmap.md`. Do not scaffold multiple phases in one pass.
- **Verify before proceeding:** Each phase must end with something runnable or deployed before starting the next.
- **Architectural boundaries:** Flag any deviation from ADR-001 (Cloudflare Workers + KV Content Sync) or ADR-002 (Database Abstraction / Loose Coupling) before implementing it.
- **Deployment & Runtime:** Cloudflare Workers ONLY (`apps/web` via `@astrojs/cloudflare`, `apps/api` via Hono, shared `PORTFOLIO_KV`).
- **No vendor lock-in:** Keep the repository layer loosely coupled from any single Postgres vendor.

## Current Status & Checkpoint
- **Completed:**
  - Phase 0: Repo Skeleton & Authoritative Documentation.
  - Phase 1: Documentation Alignment & ADR-001 (Cloudflare Workers + KV alignment; Vercel references removed).
  - Phase 2: Shared schemas & stubbed data-access.
  - Phase 3: Astro frontend (`apps/web`) configured for Cloudflare Workers with `@astrojs/cloudflare` adapter, `wrangler.jsonc` (`PORTFOLIO_KV` binding), homepage reading from repository layer, and verified production builds.
  - Phase 4: Hono Sync Backend (`apps/api`) scaffolded with Cloudflare Workers types, `wrangler.jsonc`, `PORTFOLIO_KV` bindings, health/sync endpoints, and verified typechecking.
  - Phase 6: Dependency Inspection & LTS Alignment (Node >=26 engines, pnpm 12.21.0, CI Node 26, TypeScript standardized to 7.0.2 across all packages, upgraded wrangler, hono, and patched sub-dependencies via workspace overrides).
  - Phase 7: Baseline Security Hardening (Global secureHeaders, CSRF, and CORS origin allowlists on `apps/api`; `POST /sync` secret authentication; Astro `security: { checkOrigin: true }`; dynamic URL validation and dangerous scheme rejection).
  - Code Review & Remediation (CodeRabbit): Fixed CORS/CSRF domain suffix bypass vulnerability, added constant-time `timingSafeEqual` via Web Crypto on `POST /sync`, patched protocol-relative URL bypass in `sanitizeUrl`, added `pnpm build` to CI workflow, and migrated inline event listener to script block for strict CSP compatibility.
- **Active / Next:** Phase 5 — Postgres Database (Supabase) Schema & Real Data-Access Integration, followed by Phase 6 (Automated Content Sync Pipeline via `PORTFOLIO_KV`).
