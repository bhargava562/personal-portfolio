-- Migration 0003: Create public.skills linked to public.profile (schema & security only)

BEGIN;

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  proof_text text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT skills_profile_name_key UNIQUE (profile_id, name)
);

CREATE INDEX IF NOT EXISTS idx_skills_profile_order
  ON public.skills (profile_id, display_order);

-- Enable Row Level Security (with no public policies = deny by default)
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke default table privileges from anon and authenticated roles
REVOKE ALL ON TABLE public.skills FROM anon, authenticated;

COMMIT;
