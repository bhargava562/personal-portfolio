-- Seed data for public.volunteering (L0 public-safe, no retired claims)

BEGIN;

WITH target_profile AS (
  SELECT id
  FROM public.profile
  WHERE slug = 'main'
)
INSERT INTO public.volunteering (
  profile_id,
  role_title,
  organization,
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
  seed.start_date,
  seed.end_date,
  seed.highlights,
  seed.display_order,
  now()
FROM target_profile
CROSS JOIN (
  VALUES
    (
      'Lead Organizer',
      'Google Developer Group - R.M.K. Engineering College',
      DATE '2026-10-01',
      NULL::date,
      ARRAY[
        'Guiding campus developer initiatives and chapter operations as GDGoC Lead Organizer.'
      ],
      1
    ),
    (
      'Technical Team Member',
      'Google Developer Group - R.M.K. Engineering College',
      DATE '2025-12-01',
      DATE '2026-10-31',
      ARRAY[
        'Provided technical support and event tooling contributions across campus developer sessions.'
      ],
      2
    ),
    (
      'CSBS Student Association Member',
      'R.M.K Engineering College',
      DATE '2025-08-01',
      DATE '2025-12-31',
      ARRAY[
        'Participated in student association activities at R.M.K Engineering College.'
      ],
      3
    )
) AS seed(
  role_title,
  organization,
  start_date,
  end_date,
  highlights,
  display_order
)
ON CONFLICT (profile_id, organization, role_title, start_date) DO UPDATE SET
  end_date = EXCLUDED.end_date,
  highlights = EXCLUDED.highlights,
  display_order = EXCLUDED.display_order,
  updated_at = now();

COMMIT;
