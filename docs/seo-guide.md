# SEO & Generative Engine Optimization (GEO) Guide

> **Document Type:** Technical Architecture & Operational Guide (Not an ADR)  
> **Target Applications:** `apps/web` (Astro on Cloudflare Workers)  
> **Canonical Domain:** `https://bhargavaa.dev`  
> **Entity:** Bhargava A — Backend, AI & Systems Software Engineer  

---

## 1. Overview & Strategy

Modern technical discovery requires dual-track optimization:
1. **Traditional Search Engine Optimization (SEO):** Indexing, ranking, and rich link presentation on Google, Bing, LinkedIn, and social platforms via semantic HTML, clean canonical URLs, Open Graph / Twitter Card metadata, and XML sitemaps.
2. **Generative Engine Optimization (GEO / AI SEO):** Enabling AI search engines, answer bots, and research models (SearchGPT, Perplexity, Claude, Gemini, Copilot, Apple Intelligence) to accurately retrieve, attribute, and synthesize technical background, credentials, and project outcomes without hallucination.

Because the frontend is built with **Astro** (`apps/web`) and deployed to **Cloudflare Workers** with 0 client-side framework runtime by default, the site achieves high performance, perfect Time to First Byte (TTFB), and zero render-blocking JavaScript.

---

## 2. Technical SEO Architecture (`apps/web`)

### 2.1 Domain & Trailing Slash Consistency (`astro.config.mjs`)
Duplicate URL penalties occur when search engines index both trailing-slash and non-trailing-slash versions of identical content (e.g., `/resume` vs `/resume/`).

In `apps/web/astro.config.mjs`:
```js
export default defineConfig({
  site: process.env.SITE_URL || "https://bhargavaa.dev",
  trailingSlash: "never",
  adapter: cloudflare(),
  integrations: [preact(), sitemap()],
  devToolbar: {
    enabled: false,
  },
  security: {
    checkOrigin: true,
  },
});
```
- `site`: Informs Astro of the absolute production root URL, enabling `@astrojs/sitemap` and dynamic canonical resolution via `Astro.site`.
- `trailingSlash: "never"`: Enforces consistent, clean URL formatting without duplicate route variants.

---

### 2.2 Unified Metadata Component (`apps/web/src/components/SEOHead.astro`)
All metadata, social preview cards, canonical tags, and structured data are encapsulated inside `SEOHead.astro`. Every Astro page imports and mounts this component inside `<head>`.

#### Key Responsibilities:
- **Canonical URLs:** Dynamically stripped of search queries (`?utm_...`) or fragment hashes (`#...`) using `Astro.site` and `Astro.url.pathname`.
- **Social Graph Previews:** Standard Open Graph (`og:title`, `og:description`, `og:image`, `og:type`, `og:url`) and Twitter Cards (`summary_large_image`).
- **Robots Directives:** Standardized indexation meta tags:
  ```html
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  ```
- **XSS-Safe JSON-LD:** Structured data is serialized and sanitized before output to prevent cross-site scripting vulnerabilities.

---

### 2.3 Automated XML Sitemap (`@astrojs/sitemap`)
The `@astrojs/sitemap` integration is installed in `apps/web`. When `astro build` executes:
- Astro scans all prerendered static routes (`/`, `/resume`).
- Outputs `dist/sitemap-index.xml` and `dist/sitemap-0.xml` during the build step.
- The sitemap location is published in `apps/web/public/robots.txt`:
  ```txt
  Sitemap: https://bhargavaa.dev/sitemap-index.xml
  ```

---

## 3. Generative Engine Optimization (GEO) & AI Retrieval

AI crawlers parse structured entities and content summaries to answer user questions about developers, skills, and projects.

### 3.1 Schema.org High-Fidelity JSON-LD
Inside `apps/web/src/components/SEOHead.astro`, a standardized Schema.org graph connects the canonical domain to authoritative external identities (`sameAs`):

```json
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": {
    "@type": "Person",
    "name": "Bhargava A",
    "url": "https://bhargavaa.dev",
    "jobTitle": "Software Engineering Student & Backend / AI Developer",
    "alumniOf": {
      "@type": "CollegeOrUniversity",
      "name": "R.M.K. Engineering College"
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Chennai",
      "addressRegion": "Tamil Nadu",
      "addressCountry": "IN"
    },
    "knowsAbout": [
      "Java", "Spring Boot", "Python", "FastAPI", "TypeScript",
      "PostgreSQL", "Cloudflare Workers", "Astro", "Hono",
      "Multi-Agent AI Systems", "Distributed Systems", "Clean Architecture"
    ],
    "hasCredential": [
      {
        "@type": "EducationalOccupationalCredential",
        "name": "Oracle Certified Professional: Java SE 21 Developer"
      },
      {
        "@type": "EducationalOccupationalCredential",
        "name": "Oracle AI Vector Search Professional"
      },
      {
        "@type": "EducationalOccupationalCredential",
        "name": "GitHub Foundations"
      }
    ],
    "sameAs": [
      "https://github.com/bhargava562",
      "https://www.linkedin.com/in/bhargavaa1/",
      "https://leetcode.com/u/Bhargava2525/",
      "https://codeforces.com/profile/bhargava_a5",
      "https://atcoder.jp/users/bhargavaa1",
      "https://www.hackerrank.com/profile/Bhargava_A_056/",
      "https://codolio.com/profile/bhargavA45"
    ]
  }
}
```

#### Security Hardening (XSS Prevention):
To prevent script injection when embedding user-provided or database-derived JSON-LD into HTML, the raw JSON string is sanitized before injection:
```ts
const serializedJsonLd = JSON.stringify(activeJsonLd).replace(/</g, "\\u003c");
```
```astro
<script type="application/ld+json" set:html={serializedJsonLd} />
```

---

### 3.2 AI Crawler Permissions (`apps/web/public/robots.txt`)
Search engines and AI answer engines employ specific user-agents for indexation and retrieval. Modern AI engines are explicitly authorized:

```txt
# robots.txt for Bhargava A Portfolio (Traditional + AI Search Engines)
User-agent: *
Allow: /

# Dedicated Permissions for Modern AI Retrieval & Answer Engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Applebot
Allow: /

# XML Sitemap reference
Sitemap: https://bhargavaa.dev/sitemap-index.xml
```

---

### 3.3 AI Context Index (`apps/web/public/llms.txt`)
Following the emerging `llms.txt` convention (proposed for standardized LLM context discovery), `apps/web/public/llms.txt` serves a structured markdown summary designed for consumption by LLM browser agents, web retrievers, and AI assistants.

It documents:
- Professional identity and educational background (R.M.K. Engineering College).
- Core technical competencies (Java, Python, TypeScript, Spring Boot, FastAPI, Astro, Hono).
- Measured outcomes of flagship projects (BlockSafe, Portfolio OS, Friday).
- Verified credentials and external authority links.

---

## 4. Post-Launch Submission Workflow

Once the domain `bhargavaa.dev` is connected to Cloudflare Workers, execute the following zero-cost submission steps:

```
[Deploy to Cloudflare Workers]
              │
              ▼
   [Google Search Console] ──► Add Property (DNS Verification via Cloudflare)
              │                 Submit Sitemap: https://bhargavaa.dev/sitemap-index.xml
              ▼
  [Bing Webmaster Tools]   ──► Import verified property from Google Search Console
              │                 (Instantly enables Copilot & Yahoo search indexing)
              ▼
   [Cloudflare IndexNow]   ──► Enable IndexNow toggle in Cloudflare Dashboard
                               (Pushes instant crawl notifications on updates)
```

### Step 1: Google Search Console
1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Choose **Domain** property and enter `bhargavaa.dev`.
3. Add the provided `TXT` verification record to Cloudflare DNS.
4. Go to **Sitemaps** in the sidebar and enter `sitemap-index.xml`.

### Step 2: Bing Webmaster Tools & Microsoft Copilot
1. Navigate to [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Click **Import from Google Search Console** for instant verification.
3. Verify that `sitemap-index.xml` is recognized. This feeds Bing Search and Microsoft Copilot answer citations.

### Step 3: Cloudflare Crawl Center & IndexNow
1. In Cloudflare Dashboard, select the `bhargavaa.dev` zone.
2. Navigate to **Speed** / **Optimization** or **Scrape Shield**.
3. Enable **IndexNow** to automatically notify participating search engines whenever pages change.

---

## 5. Verification & Audit Checklist

Execute these checks before and after publishing production updates:

| Check | Tool / Method | Target Result |
| :--- | :--- | :--- |
| **Typecheck** | `pnpm --filter @portfolio/web typecheck` | 0 TypeScript errors |
| **Production Build** | `pnpm --filter @portfolio/web build` | Clean build generating `dist/sitemap-index.xml` |
| **Robots Header** | `curl -I https://bhargavaa.dev/robots.txt` | HTTP 200 with text/plain body |
| **Sitemap Accessibility** | `curl -I https://bhargavaa.dev/sitemap-index.xml` | HTTP 200 with valid XML |
| **JSON-LD Validity** | [Google Rich Results Test](https://search.google.com/test/rich-results) | Valid `ProfilePage` and `Person` detected |
| **Schema Graph** | [Schema.org Validator](https://validator.schema.org) | 0 errors, 0 warnings on Person entity |
| **Social Card Preview** | [OpenGraph.xyz](https://www.opengraph.xyz) | Accurate title, description, and preview image |
