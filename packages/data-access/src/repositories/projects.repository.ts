import type { Project } from "@portfolio/shared";

// STUB — Phase 5 replaces this body with a real Supabase query.
// Signature never changes, so apps/web never needs editing.
const STUB_PROJECTS: Project[] = [
  {
    slug: "orbit-engine",
    title: "Orbit Engine",
    description: "High-performance distributed task scheduler built with TypeScript and WebAssembly.",
    longDescription:
      "A resilient, low-latency background job execution platform capable of scheduling and running millions of micro-tasks across distributed nodes with sub-millisecond dispatch times.",
    techStack: ["TypeScript", "Rust", "WebAssembly", "PostgreSQL"],
    demoUrl: "https://example.com/orbit",
    repoUrl: "https://github.com/bhargava562/orbit-engine",
    isFeatured: true,
    sortOrder: 1,
  },
  {
    slug: "nexus-metrics",
    title: "Nexus Metrics",
    description: "Lightweight, privacy-first analytics pipeline with real-time aggregation and zero-cookie tracking.",
    longDescription:
      "Engineered an event ingestion service handling high write volume with sub-10ms response times, paired with a static dashboard showing aggregate trends without storing PII.",
    techStack: ["Hono", "TypeScript", "PostgreSQL", "Vanilla CSS"],
    demoUrl: "https://example.com/nexus",
    repoUrl: "https://github.com/bhargava562/nexus-metrics",
    isFeatured: true,
    sortOrder: 2,
  },
  {
    slug: "canvas-flow",
    title: "Canvas Flow",
    description: "Minimalist architectural diagramming tool rendering smooth vector canvas primitives.",
    longDescription:
      "Interactive infinite canvas supporting complex node graphs, pan/zoom gestures, and instant SVG/PNG exports with zero external drawing dependencies.",
    techStack: ["Astro", "Preact", "TypeScript", "HTML5 Canvas"],
    demoUrl: "https://example.com/canvas",
    repoUrl: "https://github.com/bhargava562/canvas-flow",
    isFeatured: false,
    sortOrder: 3,
  },
];

export async function getProjects(): Promise<Project[]> {
  return STUB_PROJECTS;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const project = STUB_PROJECTS.find((p) => p.slug === slug);
  return project ?? null;
}
