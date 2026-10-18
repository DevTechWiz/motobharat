-- MotoBharat — Migration 017: ride join controls
-- Rider limit (optional capacity cap) + admin pause switch, and the join
-- gate v3: member inserts only for published upcoming rides that aren't
-- paused and aren't full.

-- ── columns ────────────────────────────────────────────────

alter table public.events
  add column if not exists max_riders int;

alter table public.events
  add column if not exists joining_paused boolean not null default false;

do $$ begin
  alter table public.events
    add constraint events_max_riders_check check (max_riders is null or max_riders > 0);
exception when duplicate_object then null;
end $$;

-- ── join gate v3: registered + open ride ───────────────────
-- joinRide (server action) is the primary gate and shows friendly errors;
-- this policy blocks inserts that skip it. Full members keep leaving
-- (only inserts are gated).

drop policy "Registered riders can join rides" on public.event_members;

create policy "Registered riders can join open upcoming rides"
  on public.event_members for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.rider_details rd
      where rd.user_id = auth.uid() and rd.registered = true
    )
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and e.status = 'published'
        and e.starts_at > now()
        and e.joining_paused = false
        and (
          e.max_riders is null
          or e.max_riders > (
            select count(*) from public.event_members m
            where m.event_id = e.id
          )
        )
    )
  );
