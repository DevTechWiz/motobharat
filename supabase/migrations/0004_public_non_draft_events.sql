-- MotoBharat — Migration 004: public read for completed/cancelled rides.
-- 0001's events select policy exposed only status='published', but the public UI shows
-- Completed and Cancelled tabs on /rides (04_UI, 11_WORKFLOWS section D) and anyone may
-- read a non-draft ride (03_API "Read one | public"). Open the policy to every non-draft
-- status; drafts stay admin-only. Sibling tables (event_members, gallery) already use
-- using (true) and need no change.

drop policy if exists "Published events are viewable by everyone" on public.events;
drop policy if exists "Non-draft events are viewable by everyone" on public.events;

create policy "Non-draft events are viewable by everyone"
  on public.events for select
  using (status <> 'draft' or auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));
