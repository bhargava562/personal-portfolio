import type { Profile, Skill, Experience, Education } from "@portfolio/shared";

// STUB — Phase 5 replaces these with real Supabase queries.
const STUB_PROFILE: Profile = {
  name: "Bhargava A",
  role: "Full-Stack Engineer & Systems Architect",
  headline: "Building resilient, zero-bloat web applications and systems.",
  bio: "Passionate software engineer focused on clean architecture, minimal runtime footprints, static-first web applications, and dependable distributed systems.",
  location: "India",
  email: "bhargavaanand2006@gmail.com",
  githubUrl: "https://github.com/bhargava562",
  linkedinUrl: "https://linkedin.com/in/bhargava-a",
  availableForHire: true,
};

const STUB_SKILLS: Skill[] = [
  { name: "TypeScript", category: "Frontend", proficiency: 5, sortOrder: 1 },
  { name: "Astro", category: "Frontend", proficiency: 5, sortOrder: 2 },
  { name: "Preact", category: "Frontend", proficiency: 4, sortOrder: 3 },
  { name: "Vanilla CSS", category: "Frontend", proficiency: 5, sortOrder: 4 },
  { name: "Hono", category: "Backend", proficiency: 5, sortOrder: 5 },
  { name: "Node.js", category: "Backend", proficiency: 5, sortOrder: 6 },
  { name: "PostgreSQL", category: "Database", proficiency: 4, sortOrder: 7 },
  { name: "Supabase", category: "Database", proficiency: 4, sortOrder: 8 },
  { name: "Git & GitHub Actions", category: "DevOps", proficiency: 5, sortOrder: 9 },
  { name: "Vercel", category: "DevOps", proficiency: 5, sortOrder: 10 },
  { name: "System Design", category: "Architecture", proficiency: 4, sortOrder: 11 },
  { name: "Clean Architecture", category: "Architecture", proficiency: 5, sortOrder: 12 },
];

const STUB_EXPERIENCES: Experience[] = [
  {
    role: "Full-Stack Software Engineer",
    company: "Personal Projects & Open Source",
    location: "Remote",
    startDate: "2024",
    current: true,
    points: [
      "Architected a static-first portfolio and resume generation platform with zero database reads per visitor.",
      "Engineered decoupled repository layers to guarantee vendor-independent database access.",
      "Designed automated CI/CD workflows using GitHub Actions and Playwright for headless PDF compilation.",
    ],
  },
];

const STUB_EDUCATIONS: Education[] = [
  {
    degree: "Computer Science & Engineering",
    institution: "University",
    startYear: "2022",
    endYear: "2026",
    details: "Core focus on algorithms, distributed computing, database systems, and software architecture.",
  },
];

export async function getProfile(): Promise<Profile> {
  return STUB_PROFILE;
}

export async function getSkills(): Promise<Skill[]> {
  return STUB_SKILLS;
}

export async function getExperiences(): Promise<Experience[]> {
  return STUB_EXPERIENCES;
}

export async function getEducations(): Promise<Education[]> {
  return STUB_EDUCATIONS;
}
