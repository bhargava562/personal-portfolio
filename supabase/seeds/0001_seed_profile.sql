-- Seed data for public.profile (L0 public-safe)
BEGIN;

INSERT INTO public.profile (
  slug,
  full_name,
  active_role,
  headline,
  career_summary,
  opportunities_seeking,
  location,
  email,
  resume_url,
  updated_at
)
VALUES (
  'main',
  'Bhargava A',
  'Java Software Developer',
  'Java Software Developer focused on reliable backend services, clean architecture, and practical software engineering',
  'Java Software Developer and B.Tech Computer Science and Business Systems student at R.M.K. Engineering College (2024–2028, CGPA 8.75/10). Experienced building structured application logic, REST APIs, and database-backed workflows with a focus on clarity, maintainability, and measurable performance.',
  'Seeking Java software engineering, backend engineering, and software developer internship or early-career opportunities.',
  'Chennai, Tamil Nadu, India',
  'bhargavaanand2006@gmail.com',
  '/resume',
  now()
)
ON CONFLICT (slug) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  active_role = EXCLUDED.active_role,
  headline = EXCLUDED.headline,
  career_summary = EXCLUDED.career_summary,
  opportunities_seeking = EXCLUDED.opportunities_seeking,
  location = EXCLUDED.location,
  email = EXCLUDED.email,
  resume_url = EXCLUDED.resume_url,
  updated_at = now();

COMMIT;
