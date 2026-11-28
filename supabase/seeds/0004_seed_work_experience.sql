-- Seed data for public.work_experience (L0 public-safe, ordered quantified highlights)

BEGIN;

WITH target_profile AS (
  SELECT id
  FROM public.profile
  WHERE slug = 'main'
)
INSERT INTO public.work_experience (
  profile_id,
  role_title,
  organization,
  employment_type,
  location,
  start_date,
  end_date,
  highlights,
  display_order,
  updated_at
)
SELECT
  target_profile.id,
  seed.role_title,
  seed.organization,
  seed.employment_type,
  seed.location,
  seed.start_date,
  seed.end_date,
  seed.highlights,
  seed.display_order,
  now()
FROM target_profile
CROSS JOIN (
  VALUES
    (
      'Back End Developer Intern',
      'Linkific',
      'Internship',
      'Remote',
      DATE '2026-04-01',
      DATE '2026-08-31',
      ARRAY[
        'Secured 5+ FastAPI auth and user REST APIs via JWT, RBAC, bcrypt, and Google OAuth 2.0, blocking unauthorised access.',
        'Diagnosed cloud HTTP bottlenecks and cut warm latency ~34% (181 to 120 ms; 179 ms logins) via pooled PostgreSQL connections and TTL caching.',
        'Built a fault-tolerant Python queue pipeline over PostgreSQL with SlowAPI rate limiting and request logging, preventing traffic spikes.'
      ],
      1
    ),
    (
      'Front-End Developer Intern',
      'TEN: Brain Research',
      'Internship',
      'Remote',
      DATE '2025-06-01',
      DATE '2025-07-31',
      ARRAY[
        'Troubleshot UI crashes, memory leaks, and re-renders across 28 React.js components (8 routes) via Error Boundaries, useCallback, and useEffect (1.62s LCP).',
        'Delivered clean production builds (13.39s, HTTP 200) by testing UI layouts in Google Chrome and resolving Git conflicts across team PRs.'
      ],
      2
    )
) AS seed(
  role_title,
  organization,
  employment_type,
  location,
  start_date,
  end_date,
  highlights,
  display_order
)
ON CONFLICT (profile_id, organization, role_title, start_date) DO UPDATE SET
  employment_type = EXCLUDED.employment_type,
  location = EXCLUDED.location,
  end_date = EXCLUDED.end_date,
  highlights = EXCLUDED.highlights,
  display_order = EXCLUDED.display_order,
  updated_at = now();

COMMIT;
