-- Migration 0002: Create public.social_profiles linked to public.profile

BEGIN;

CREATE TABLE IF NOT EXISTS public.social_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  platform text NOT NULL,
  profile_url text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT social_profiles_profile_platform_key UNIQUE (profile_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_profiles_profile_order
  ON public.social_profiles (profile_id, display_order);

-- Enable Row Level Security (with no public policies = deny by default)
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke default table privileges from anon and authenticated roles
REVOKE ALL ON TABLE public.social_profiles FROM anon, authenticated;

COMMIT;
