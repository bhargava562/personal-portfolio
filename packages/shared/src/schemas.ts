import { z } from "zod";

export const ProjectSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  longDescription: z.string().optional(),
  techStack: z.array(z.string()),
  demoUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().default(0),
});
export type Project = z.infer<typeof ProjectSchema>;

export const SkillSchema = z.object({
  name: z.string(),
  category: z.enum(["Frontend", "Backend", "Database", "DevOps", "Tools", "Architecture"]),
  proficiency: z.number().min(1).max(5).optional(),
  sortOrder: z.number().default(0),
});
export type Skill = z.infer<typeof SkillSchema>;

export const ExperienceSchema = z.object({
  role: z.string(),
  company: z.string(),
  companyUrl: z.string().url().optional(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  points: z.array(z.string()),
});
export type Experience = z.infer<typeof ExperienceSchema>;

export const EducationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  location: z.string().optional(),
  startYear: z.string(),
  endYear: z.string().optional(),
  details: z.string().optional(),
});
export type Education = z.infer<typeof EducationSchema>;

export const ProfileSchema = z.object({
  name: z.string(),
  role: z.string(),
  headline: z.string(),
  bio: z.string(),
  location: z.string(),
  email: z.string().email(),
  githubUrl: z.string().url(),
  linkedinUrl: z.string().url(),
  availableForHire: z.boolean().default(true),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ResumeDataSchema = z.object({
  profile: ProfileSchema,
  skills: z.array(SkillSchema),
  experiences: z.array(ExperienceSchema),
  educations: z.array(EducationSchema),
  featuredProjects: z.array(ProjectSchema),
});
export type ResumeData = z.infer<typeof ResumeDataSchema>;

export const ResumeTokenSchema = z.object({
  token: z.string(),
  recipientName: z.string(),
  expiresAt: z.string(),
  maxViews: z.number().default(5),
  viewCount: z.number().default(0),
  isRevoked: z.boolean().default(false),
});
export type ResumeToken = z.infer<typeof ResumeTokenSchema>;

export const AnalyticsEventSchema = z.object({
  eventType: z.enum(["page_view", "resume_view", "resume_download", "project_click"]),
  path: z.string(),
  referrer: z.string().optional(),
  deviceType: z.enum(["desktop", "mobile", "tablet", "bot", "unknown"]).optional(),
  timestamp: z.string().datetime().optional(),
});
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
