-- Migration 0004: Add proficiency score column to public.skills

BEGIN;

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS proficiency smallint NOT NULL DEFAULT 0
  CONSTRAINT skills_proficiency_range_check CHECK (proficiency BETWEEN 0 AND 100);

COMMIT;
