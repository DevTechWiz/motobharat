-- MotoBharat seed — demo riders, rides, joins, gallery, announcements.
-- Idempotent: fixed ids + ON CONFLICT DO NOTHING. Safe to run twice.
-- Run in the Supabase SQL editor AFTER 0001_init.sql + 0002_rider_details.sql. Docs: 11_WORKFLOWS.md
-- Demo notes:
--   * riders = stub rows in auth.users (fake UUIDs, password unused — Google-only auth,
--     they cannot sign in); the signup trigger auto-creates their profiles rows.
--   * gallery + covers use DEMO unsplash links — replace via admin R2 upload (06_MEDIA.md).
-- Times: built as UTC wall-clock then anchored with AT TIME ZONE 'UTC' (session-TZ safe).
--   +6d 00:30 UTC = 06:00 IST, -7d 01:00 UTC = 06:30 IST, +3d 14:00 UTC = 19:30 IST.

-- Demo riders (auth.users stubs → trigger creates profiles) --------------------
-- encrypted_password is a dummy literal: Google-only auth, these accounts can never sign in.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  (
    'c0000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'arjun.demo@motobharat.example',
    'demo-not-loginable',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Arjun Rao","avatar_url":"https://i.pravatar.cc/150?img=12"}',
    now(), now()
  ),
  (
    'c0000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'sneha.demo@motobharat.example',
    'demo-not-loginable',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Sneha Reddy","avatar_url":"https://i.pravatar.cc/150?img=47"}',
    now(), now()
  ),
  (
    'c0000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'vijay.demo@motobharat.example',
    'demo-not-loginable',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Vijay Kumar","avatar_url":"https://i.pravatar.cc/150?img=33"}',
    now(), now()
  ),
  (
    'c0000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'kavya.demo@motobharat.example',
    'demo-not-loginable',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Kavya Sri","avatar_url":"https://i.pravatar.cc/150?img=45"}',
    now(), now()
  )
on conflict (id) do nothing;

-- Demo rider KYC (registered, so joins pass the 0002 insert policy) ------------
insert into public.rider_details
  (user_id, age, gender, phone, blood_group, emergency_contact_name, emergency_contact_phone, bike_model, registered)
values
  ('c0000000-0000-4000-8000-000000000001', 28, 'male', '+919876500001', 'B+', 'Lakshmi Rao', '+919876500101', 'Royal Enfield Classic 350', true),
  ('c0000000-0000-4000-8000-000000000002', 25, 'female', '+919876500002', 'O+', 'Suresh Reddy', '+919876500102', 'TVS Ronin', true),
  ('c0000000-0000-4000-8000-000000000003', 31, 'male', '+919876500003', 'A+', 'Prasad Kumar', '+919876500103', 'Bajaj Dominar 400', true),
  ('c0000000-0000-4000-8000-000000000004', 24, 'female', '+919876500004', 'AB-', 'Radhika Devi', '+919876500104', 'Honda CB350', true)
on conflict (user_id) do nothing;

-- Rides -------------------------------------------------------------------
insert into public.events
  (id, slug, title, description, starts_at, meeting_point, distance_km, difficulty, cover_url, status, created_by)
values
  (
    'a0000000-0000-4000-8000-000000000001',
    'pakhal-lake-sunday-ride',
    'Pakhal Lake Sunday Ride',
    'Easy morning spin to Pakhal Lake. Breakfast at the lake view point, back in Warangal by noon. Helmets and riding gear mandatory. Steady pace, no racing — we ride as a column.',
    (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '6 days' + interval '30 minutes') AT TIME ZONE 'UTC',
    'Pakhal Lake main gate, Warangal',
    95,
    'moderate',
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80',
    'published',
    null
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    'ramappa-heritage-loop',
    'Ramappa Heritage Loop',
    'Ramappa Temple loop via Ghanpur. Heritage stops, photo break at the lake, relaxed pace suitable for newer riders. Full gear + valid licence required.',
    (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '13 days' + interval '30 minutes') AT TIME ZONE 'UTC',
    'Hanamkonda Police Station junction',
    70,
    'easy',
    'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1200&q=80',
    'published',
    null
  ),
  (
    'a0000000-0000-4000-8000-000000000003',
    'bhadrachalam-ghat-run',
    'Bhadrachalam Ghat Run',
    'Long ghat day-run to Bhadrachalam and back. Experienced riders only — sustained curves, early start, lunch stop en route.',
    (date_trunc('day', now() AT TIME ZONE 'UTC') - interval '7 days' + interval '1 hour') AT TIME ZONE 'UTC',
    'Warangal Fort parking',
    120,
    'hard',
    null,
    'completed',
    null
  ),
  (
    'a0000000-0000-4000-8000-000000000004',
    'mulugu-sunrise-scout',
    'Mulugu Sunrise Scout',
    'Scouting ride for a new sunrise point near Mulugu. Draft route — awaiting confirmation of the meeting point.',
    (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '20 days') AT TIME ZONE 'UTC',
    'TBD',
    60,
    'easy',
    null,
    'draft',
    null
  ),
  (
    'a0000000-0000-4000-8000-000000000005',
    'warangal-night-ride',
    'Warangal City Night Ride',
    'Cancelled — poor monsoon forecast. The route will be rescheduled as a weekend morning ride.',
    (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '3 days' + interval '14 hours') AT TIME ZONE 'UTC',
    'Thousand Pillar Temple parking',
    35,
    'easy',
    null,
    'cancelled',
    null
  )
on conflict (id) do nothing;

-- Announcements ------------------------------------------------------------
insert into public.announcements (id, slug, title, body, created_by)
values
  (
    'b0000000-0000-4000-8000-000000000001',
    'monsoon-riding-guidelines',
    'Monsoon Riding Guidelines',
    'Monsoon rides are on. Wet roads, loose gravel and reduced visibility — ride accordingly.
- Full-face helmet and rain jacket mandatory.
- Increase following distance; no hard braking into corners.
- Led ride leaders will call halt points more often.
- Ride gets called off if heavy rain is forecast at the meeting time — watch announcements.',
    null
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'saturday-morning-meetup',
    'Saturday Morning Meetup',
    'Every Saturday 6:30 AM at the usual junction — open meetup for anyone from the community. Chai, route planning for the week ahead, and new rider introductions. No registration needed, just show up geared up.',
    null
  ),
  (
    'b0000000-0000-4000-8000-000000000003',
    'first-aid-workshop',
    'First-Aid Workshop for Riders',
    'Free two-hour first-aid session covering on-road trauma basics, spinal immobilisation and kit building. Date and venue will be posted here shortly — slots are limited to 30 riders.',
    null
  )
on conflict (id) do nothing;

-- Ride joins ----------------------------------------------------------------
insert into public.event_members (event_id, user_id)
values
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000004'),
  ('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003')
on conflict (event_id, user_id) do nothing;

-- Gallery (DEMO unsplash links — replace via admin R2 upload) ----------------
insert into public.gallery (id, event_id, url, thumb_url, mime, width, height, alt)
values
  (
    'd0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=400&q=75',
    'image/jpeg', 1600, 1067, 'DEMO — mountain highway at golden hour'
  ),
  (
    'd0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000001',
    'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=400&q=75',
    'image/jpeg', 1600, 1067, 'DEMO — misty ghat road through the hills'
  ),
  (
    'd0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000001',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=75',
    'image/jpeg', 1600, 1067, 'DEMO — open road winding through hills'
  ),
  (
    'd0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000002',
    'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&crop=entropy&w=1600&q=80',
    'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=400&q=75',
    'image/jpeg', 1600, 1067, 'DEMO — tea-country curves near the temple road'
  ),
  (
    'd0000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000002',
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&crop=entropy&w=1600&q=80',
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=400&q=75',
    'image/jpeg', 1600, 1067, 'DEMO — morning light on the highway'
  ),
  (
    'd0000000-0000-4000-8000-000000000006',
    'a0000000-0000-4000-8000-000000000003',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&crop=entropy&w=1600&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=75',
    'image/jpeg', 1600, 1067, 'DEMO — ghat run viewpoint stop'
  )
on conflict (id) do nothing;
