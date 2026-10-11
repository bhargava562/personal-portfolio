import type { AnalyticsEvent } from "@portfolio/shared";

// STUB — Phase 5 replaces this with an insert into Supabase / Postgres.
export async function recordPageView(
  event: AnalyticsEvent
): Promise<{ success: boolean; recordedAt: string }> {
  // In development/stub mode, simulate successful ingestion
  return {
    success: true,
    recordedAt: event.timestamp ?? new Date().toISOString(),
  };
}
