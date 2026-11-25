-- Migration 0001: Create public.profile table with default-deny RLS
BEGIN;

CREATE TABLE IF NOT EXISTS public.profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE DEFAULT 'main',
  full_name text NOT NULL,
  active_role text NOT NULL,
  headline text NOT NULL,
  career_summary text NOT NULL,
  opportunities_seeking text NOT NULL,
  location text NOT NULL,
  email text NOT NULL,
  resume_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (with no public policies = deny by default)
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;

-- Explicitly revoke default table privileges from anon and authenticated roles
REVOKE ALL ON TABLE public.profile FROM anon, authenticated;

COMMIT;
