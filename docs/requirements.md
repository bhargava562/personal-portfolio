# Requirements Specification

## 1. Functional Requirements

- **Portfolio Content Sync:**
  - Content updates happen by inserting or updating rows in Postgres.
  - No manual code changes, commits, or dashboard redeployments required.
  - Automatically rebuilds and publishes static content within 60 seconds (ADR-001).
- **Interactive & Printable Resume:**
  - Synchronized from the same single source of truth in Postgres.
  - In-browser interactive viewer with zoom and section jumping (Preact island).
  - High-fidelity printable view (`@media print`) and downloadable PDF (`Bhargava_Resume.pdf`).
- **Tokenized Resume Links:**
  - Time-limited or view-capped personalized links for recruiters and hiring managers.
  - Anonymous view analytics (referrer, device type, access timestamp) via Hono API.

---

## 2. Non-Functional Requirements

- **Static-First & Zero DB Reads Per Visitor:**
  - 100% static HTML served from edge CDN.
  - Visiting the site generates 0 database queries.
- **Fast Load & Performance Budget:**
  - Sub-second FCP and LCP across global regions.
  - Lighthouse audit budget: 95+ score across Performance, Accessibility, Best Practices, and SEO.
- **Free-Tier Hosting Only:**
  - Completely operable within free tiers (Vercel, Supabase/Postgres, GitHub Actions).
  - Resilient to sleeping databases: site never goes down if the database is paused.
- **No Database Vendor Lock-In (ADR-002):**
  - Loose coupling: `packages/data-access` encapsulates the database driver.
  - Seamless migration path to Neon or standard PostgreSQL without touching `apps/web` or `apps/api`.
- **Zero Redundant Infrastructure:**
  - No Redis, no CDC pipelines, no complex caching invalidation layers. The static CDN serves as the cache.

---

## 3. Browser Support Policy

To ensure the portfolio functions reliably across old and modern devices alike, the UI adheres to a strict three-tier support matrix:

### Tier 1: Modern Evergreen Browsers (Full Fidelity)
- **Browsers:** Chrome $\ge 110$, Edge $\ge 110$, Firefox $\ge 115$, Safari $\ge 16.4$, iOS Safari $\ge 16.4$, Chrome Android $\ge 110$.
- **Experience:**
  - Full aesthetic fidelity: glassmorphic backdrops, smooth gradient accents, CSS container queries, subgrid where applicable, micro-animations.
  - Interactive Preact islands fully hydrated (command palette, resume toolbar).
  - WebP/AVIF image formats served.

### Tier 2: Legacy Browsers (Graceful Degradation, ~2–5 Years Old)
- **Browsers:** Chrome 80–109, Firefox 78–114, Safari 13–16.3, Edge 80–109, older Android WebViews.
- **Experience:**
  - Layout integrity guaranteed: CSS Flexbox and standard CSS Grid fallbacks.
  - Visual fallbacks: Solid translucent background colors instead of `backdrop-filter: blur()`.
  - Native standard font stacks if modern web fonts fail to load.
  - Islands gracefully function with standard DOM fallbacks if modern JS features are unavailable.

### Tier 3: Minimalist / Ultra-Old Browsers & No-JavaScript (Core Content Guaranteed)
- **Browsers:** Legacy browsers (e.g. Internet Explorer 11, Safari < 13), text-based browsers (Lynx, w3m), search engine bots, or environments with JavaScript disabled.
- **Experience:**
  - 100% of portfolio text, projects, career history, skills, and resume content rendered cleanly as valid semantic HTML.
  - Pure Vanilla CSS styling maintains readable, linear, accessible hierarchy.
  - Printable stylesheet (`@media print`) functions via native browser Print / Save-as-PDF without requiring JavaScript.
