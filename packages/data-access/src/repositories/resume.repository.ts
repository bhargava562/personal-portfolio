import type { ResumeData } from "@portfolio/shared";
import { getProfile, getSkills, getExperiences, getEducations } from "./profile.repository";
import { getProjects } from "./projects.repository";

// STUB — Phase 5 replaces these with real Supabase queries.
export async function getResumeData(): Promise<ResumeData> {
  const [profile, skills, experiences, educations, allProjects] = await Promise.all([
    getProfile(),
    getSkills(),
    getExperiences(),
    getEducations(),
    getProjects(),
  ]);

  return {
    profile,
    skills,
    experiences,
    educations,
    featuredProjects: allProjects.filter((p) => p.isFeatured),
  };
}

export async function validateResumeToken(
  token: string
): Promise<{ valid: boolean; recipientName?: string; remainingViews?: number }> {
  // Stubbed logic: sample token "demo-recruiter-token"
  if (token === "demo-recruiter-token") {
    return {
      valid: true,
      recipientName: "Hiring Partner",
      remainingViews: 4,
    };
  }

  return { valid: false };
}
