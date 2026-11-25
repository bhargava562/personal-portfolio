-- Seed data for public.social_profiles (L0 public-safe)

BEGIN;

WITH target_profile AS (
  SELECT id
  FROM public.profile
  WHERE slug = 'main'
)
INSERT INTO public.social_profiles (
  profile_id,
  platform,
  profile_url,
  display_order,
  updated_at
)
SELECT
  target_profile.id,
  seed.platform,
  seed.profile_url,
  seed.display_order,
  now()
FROM target_profile
CROSS JOIN (
  VALUES
    ('GitHub', 'https://github.com/bhargava562', 1),
    ('LinkedIn', 'https://www.linkedin.com/in/bhargavaa1/', 2),
    ('LeetCode', 'https://leetcode.com/u/Bhargava2525/', 3),
    ('HackerRank', 'https://www.hackerrank.com/profile/Bhargava_A_056/', 4),
    ('CodeForces', 'https://codeforces.com/profile/bhargava_a5', 5),
    ('AtCoder', 'https://atcoder.jp/users/bhargavaa1', 6),
    ('Codolio', 'https://codolio.com/profile/bhargavA45', 7),
    ('SkillRack', 'http://www.skillrack.com/profile/507200/1f79196105a35b2809b0f790e06739cb1dd343d3', 8),
    ('DevPost', 'https://devpost.com/bhargava-anandakumar', 9),
    ('Unstop', 'https://unstop.com/u/bharga35070', 10)
) AS seed(platform, profile_url, display_order)
ON CONFLICT (profile_id, platform) DO UPDATE SET
  profile_url = EXCLUDED.profile_url,
  display_order = EXCLUDED.display_order,
  updated_at = now();

COMMIT;
