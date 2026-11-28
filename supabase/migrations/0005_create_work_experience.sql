-- Migration 0005: Create public.work_experience table (schema & security only)

BEGIN;

CREATE TABLE IF NOT EXISTS public.work_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  role_title text NOT NULL,
  organization text NOT NULL,
  employment_type text NOT NULL DEFAULT 'Internship',
  location text NOT NULL DEFAULT 'Remote',
  start_date date NOT NULL,
  end_date date NULL,
  highlights text[] NOT NULL DEFAULT '{}',
  display_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_experience_profile_org_role_start_key
    UNIQUE (profile_id, organization, role_title, start_date)
);

CREATE INDEX IF NOT EXISTS idx_work_experience_profile_order
  ON public.work_experience (profile_id, display_order);

-- Enable Row Level Security (with no public policies = deny by default)
ALTER TABLE public.work_experience ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke default table privileges from anon and authenticated roles
REVOKE ALL ON TABLE public.work_experience FROM anon, authenticated;

COMMIT;
