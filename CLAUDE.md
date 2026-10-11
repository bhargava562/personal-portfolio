# CLAUDE.md

See `AGENTS.md` for architecture rules — they apply here unchanged.

## Working style for this repo
- **Learning-first:** Explain *why*, not just paste code — Bhargava is learning this stack.
- **Build in phases:** Strictly adhere to `docs/roadmap.md`. Do not scaffold multiple phases in one pass.
- **Verify before proceeding:** Each phase must end with something runnable or deployed before starting the next.
- **Architectural boundaries:** Flag any deviation from ADR-001 (Automated Content Sync) or ADR-002 (Database Abstraction / Loose Coupling) before implementing it.
- **No vendor lock-in:** Keep the repository layer loosely coupled from any single Postgres vendor.

## Current Status & Checkpoint
- **Completed:** Phase 0 (Docs/Skeleton), Phase 1 (Workspace/Tooling), Phase 2 (Shared schemas & stubbed data-access), Step 3a (Astro scaffold + stubbed homepage + verified static build).
- **Active / Next:** Step 3b — Resume page & printable stylesheet (`@media print`).
