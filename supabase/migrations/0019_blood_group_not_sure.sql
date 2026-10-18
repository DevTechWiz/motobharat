-- MotoBharat — Migration 0019: allow 'Not Sure' for blood_group
-- Allows riders and pillions who do not know their blood group to select 'Not Sure'.

alter table public.rider_details drop constraint if exists rider_details_blood_group_check;

alter table public.rider_details
  add constraint rider_details_blood_group_check
  check (blood_group in ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Not Sure'));
