-- MotoBharat — RLS denial/visibility tests (docs/10_TESTS.md §1).
-- pgTAP TAP output for `supabase test db`. Fixtures are id-scoped (safe on a reused local db).
-- KYC fixtures satisfy migration 0005's enforce_kyc_complete. Everything rolls back.

begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(44);

-- Runs a modification as the CALLING role (RLS applies) and returns the affected row count.
create or replace function public.rls_test_mod(p_sql text) returns bigint
language plpgsql
as $fn$
declare n bigint;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end;
$fn$;

-- ── fixtures (superuser — bypasses RLS) ────────────────────────────────────────

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', 'rls-admin@test.local',    '{"full_name":"RLS Admin"}'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', 'rls-rider@test.local',    '{"full_name":"RLS Rider"}'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03', 'rls-stranger@test.local', '{"full_name":"RLS Stranger"}'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04', 'rls-pending@test.local',  '{"full_name":"RLS Pending"}')
on conflict (id) do nothing;

update public.profiles set role = 'admin'
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01';

insert into public.rider_details (user_id, age, gender, phone, blood_group, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, bike_model, bike_reg_no, driving_licence, experience_level, gear_level, declaration_confirmed, digital_signature, registered, dl_image_url, kyc_submitted_at, kyc_rejected)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', 25, 'male', '9000000001', 'A+', 'EC One', '9000000002', 'spouse',
    'Test Bike 200', 'TS 03 AB 1234', 'DL123456789', 'intermediate', 'full_armored', true, 'RLS Rider', true,
    'https://test.local/dl02.webp', now(), false),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03', 20, 'female', null, null, null, null, null,
    null, null, null, null, null, false, null, false,
    null, null, false),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04', 30, 'male', '9000000003', 'O+', 'EC Four', '9000000004', 'friend',
    'Test Bike 300', 'TS 03 CD 5678', 'DL987654321', 'intermediate', 'basic', true, 'RLS Pending', false,
    'https://test.local/dl04.webp', now(), false)
on conflict (user_id) do nothing;

insert into public.events (id, slug, title, starts_at, status, created_by) values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'rls-pub',   'RLS published', now() + interval '1 day', 'published', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', 'rls-comp',  'RLS completed', now() - interval '1 day', 'completed', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03', 'rls-canc',  'RLS cancelled', now() + interval '2 day', 'cancelled', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee04', 'rls-draft', 'RLS draft',     now() + interval '3 day', 'draft',     'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01')
on conflict (id) do nothing;

insert into public.gallery (id, event_id, url, thumb_url, mime, alt)
values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01',
        'https://test.local/rls.jpg', 'https://test.local/rls-t.jpg', 'image/jpeg', 'rls')
on conflict (id) do nothing;

insert into public.announcements (id, slug, title, body)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01', 'rls-notice', 'RLS Notice', 'body')
on conflict (id) do nothing;

insert into public.event_members (event_id, user_id)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01')
on conflict do nothing;

-- ── Phase A: anon ──────────────────────────────────────────────────────────────

set local role anon;

-- A1
select extensions.is(
  (select count(*) from public.profiles
    where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03')),
  3::bigint, 'A1 anon reads all profiles');
-- A2
select extensions.is(
  (select count(*) from public.rider_details
    where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03')),
  0::bigint, 'A2 anon reads 0 rider_details');
-- A3
select extensions.is(
  (select count(*) from public.events
    where id in ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01','eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02','eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03')
      and status <> 'draft'),
  3::bigint, 'A3 anon reads non-draft events');
-- A4
select extensions.is(
  (select count(*) from public.events where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee04'),
  0::bigint, 'A4 anon cannot see draft event');
-- A5
select extensions.is(
  public.rls_test_mod($$update public.events set title = 'hacked' where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01'$$),
  0::bigint, 'A5 anon update events = 0 rows');
-- A6
select extensions.is(
  public.rls_test_mod($$delete from public.announcements where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01'$$),
  0::bigint, 'A6 anon delete announcements = 0 rows');
-- A7
select extensions.is(
  public.rls_test_mod($$delete from public.event_members where event_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01'$$),
  0::bigint, 'A7 anon delete event_members = 0 rows');
-- A8
select extensions.throws_ok(
  $$insert into public.events (title, starts_at) values ('anon ride', now())$$,
  '42501', null, 'A8 anon insert events denied');
-- A9
select extensions.throws_ok(
  $$insert into public.announcements (title) values ('anon notice')$$,
  '42501', null, 'A9 anon insert announcements denied');
-- A10
select extensions.throws_ok(
  $$insert into public.gallery (event_id, url, thumb_url, mime, alt)
    values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'https://test.local/anon.jpg', 'https://test.local/anon-t.jpg', 'image/jpeg', 'anon')$$,
  '42501', null, 'A10 anon insert gallery denied');
-- A11
select extensions.throws_ok(
  $$insert into public.event_members (event_id, user_id)
    values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03')$$,
  '42501', null, 'A11 anon insert event_members denied');
-- A12
select extensions.throws_ok(
  $$insert into public.rider_details (user_id) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03')$$,
  '42501', null, 'A12 anon insert rider_details denied');
-- A13
select extensions.is(
  (select count(*) from public.verify_member('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02')),
  1::bigint, 'A13 anon verify_member returns the registered rider');
-- A14
select extensions.is(
  (select registered from public.verify_member('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02')),
  true, 'A14 anon verify_member shows registered = true');
-- A15
select extensions.is(
  (select count(*) from public.verify_member('99999999-9999-4999-8999-999999999999')),
  0::bigint, 'A15 anon verify_member unknown uid = 0 rows');
-- A16
select extensions.is(
  (select full_name from public.verify_member('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02')),
  'RLS Rider', 'A16 anon verify_member exposes the legal full name');
-- A17
select extensions.is(
  (select bike_model from public.verify_member('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02')),
  'Test Bike 200', 'A17 anon verify_member exposes the bike model');

reset role;

-- ── Phase B: registered rider (sub = rider) ───────────────────────────────────

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02","role":"authenticated"}', true);
set local role authenticated;

-- B1
select extensions.is(
  (select count(*) from public.rider_details where user_id = auth.uid()),
  1::bigint, 'B1 rider reads own rider_details');
-- B2
select extensions.is(
  (select count(*) from public.rider_details
    where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03') and user_id <> auth.uid()),
  0::bigint, 'B2 rider cannot read other rider_details');
-- B3
select extensions.is(
  public.rls_test_mod($$update public.rider_details set bike_model = 'hacked' where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03'$$),
  0::bigint, 'B3 rider update other rider_details = 0 rows');
-- B4
select extensions.is(
  public.rls_test_mod($$update public.profiles set display_name = 'hacked' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03'$$),
  0::bigint, 'B4 rider update other profile = 0 rows');
-- B5
select extensions.is(
  public.rls_test_mod($$update public.profiles set display_name = 'RLS Rider Renamed' where id = auth.uid()$$),
  1::bigint, 'B5 rider update own profile = 1 row');
-- B6
select extensions.is(
  (select count(*) from public.events
    where id in ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01','eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02','eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03')
      and status <> 'draft'),
  3::bigint, 'B6 rider reads non-draft events');
-- B7
select extensions.is(
  (select count(*) from public.events where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee04'),
  0::bigint, 'B7 rider cannot see draft event');
-- B8
select extensions.is(
  public.rls_test_mod($$update public.events set title = 'hacked' where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01'$$),
  0::bigint, 'B8 rider update events = 0 rows');
-- B9
select extensions.throws_ok(
  $$insert into public.events (title, starts_at) values ('rider ride', now())$$,
  '42501', null, 'B9 rider insert events denied');
-- B10
select extensions.throws_ok(
  $$insert into public.gallery (event_id, url, thumb_url, mime, alt)
    values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', 'https://test.local/rider.jpg', 'https://test.local/rider-t.jpg', 'image/jpeg', 'rider')$$,
  '42501', null, 'B10 rider insert gallery denied');
-- B11
select extensions.throws_ok(
  $$insert into public.announcements (title) values ('rider notice')$$,
  '42501', null, 'B11 rider insert announcements denied');
-- B12
select extensions.is(
  public.rls_test_mod($$update public.announcements set title = 'hacked' where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb01'$$),
  0::bigint, 'B12 rider update announcements = 0 rows');
-- B13
select extensions.is(
  public.rls_test_mod($$delete from public.event_members where event_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01' and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'$$),
  0::bigint, 'B13 rider delete other membership = 0 rows');
-- B14
insert into public.event_members (event_id, user_id)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02', auth.uid());
select extensions.is(
  (select count(*) from public.event_members
    where event_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02' and user_id = auth.uid()),
  1::bigint, 'B14 registered rider can join');
-- B15
select extensions.is(
  public.rls_test_mod($$delete from public.event_members where event_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02' and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02'$$),
  1::bigint, 'B15 rider can leave own membership');

reset role;

-- ── Phase B2: unregistered stranger (sub = stranger) ─────────────────────────

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03","role":"authenticated"}', true);
set local role authenticated;

-- B16
select extensions.throws_ok(
  $$insert into public.event_members (event_id, user_id)
    values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', auth.uid())$$,
  '42501', null, 'B16 unregistered rider join denied');
-- B17
select extensions.is(
  (select count(*) from public.rider_details
    where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03')
      and user_id <> auth.uid()),
  0::bigint, 'B17 stranger reads 0 other rider_details');

reset role;

-- ── Phase B3: filed-but-unapproved rider (sub = pending) ────────────────────

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04","role":"authenticated"}', true);
set local role authenticated;

-- B18
select extensions.throws_ok(
  $$insert into public.event_members (event_id, user_id)
    values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01', auth.uid())$$,
  '42501', null, 'B18 pending-approval rider join denied');

reset role;

-- ── Phase C: admin (sub = admin) ──────────────────────────────────────────────

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01","role":"authenticated"}', true);
set local role authenticated;

-- C1
select extensions.is(
  (select count(*) from public.events
    where id in ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01','eeeeeeee-eeee-4eee-8eee-eeeeeeeeee02',
                 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee03','eeeeeeee-eeee-4eee-8eee-eeeeeeeeee04')),
  4::bigint, 'C1 admin sees all 4 events incl. draft');
-- C2
select extensions.is(
  (select count(*) from public.rider_details
    where user_id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03')),
  2::bigint, 'C2 admin reads both rider_details');
-- C3
select extensions.is(
  public.rls_test_mod($$update public.events set meeting_point = 'Admin edited' where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee04'$$),
  1::bigint, 'C3 admin update draft event = 1 row');
-- C4
insert into public.gallery (event_id, url, thumb_url, mime, alt)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01',
        'https://test.local/admin.jpg', 'https://test.local/admin-t.jpg', 'image/jpeg', 'admin');
select extensions.is(
  (select count(*) from public.gallery where url = 'https://test.local/admin.jpg'),
  1::bigint, 'C4 admin insert gallery works');
-- C5
insert into public.announcements (slug, title) values ('rls-admin-notice', 'Admin Notice');
select extensions.is(
  (select count(*) from public.announcements where slug in ('rls-notice', 'rls-admin-notice')),
  2::bigint, 'C5 admin insert + read announcements');
-- C6
select extensions.is(
  public.rls_test_mod($$delete from public.event_members where event_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01' and user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'$$),
  1::bigint, 'C6 admin remove member = 1 row');
-- C7
select extensions.is(
  public.rls_test_mod($$update public.rider_details set registered = true where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04'$$),
  1::bigint, 'C7 admin approve complete pending rider = 1 row');
-- C8
select extensions.throws_ok(
  $$update public.rider_details set registered = true where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03'$$,
  'P0001', null, 'C8 admin approve incomplete rider blocked by trigger');
-- C9
select extensions.is(
  public.rls_test_mod($$update public.rider_details set dl_image_url = null where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02'$$),
  1::bigint, 'C9 approved row photo purge passes the trigger');

reset role;

select * from extensions.finish();
rollback;
