-- MotoBharat — Migration 012: ride destination, itinerary, and activities
-- Distinguish between assembly/starting point in Warangal (meeting_point)
-- and the actual ride destination (destination), plus support structured
-- route stops and multi-day itinerary milestones (itinerary), and
-- experience & highlight tags (activities).

alter table public.events
  add column if not exists destination text,
  add column if not exists itinerary jsonb default '[]'::jsonb,
  add column if not exists activities text[] default '{}'::text[];
