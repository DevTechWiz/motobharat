-- MotoBharat — Migration 0013: sponsor verify shows the rider's bike model
-- Bike model is non-sensitive (riders display their machines publicly) and makes
-- the sponsor check human: "Rides a …". Same drop-and-recreate pattern as 0011
-- (return type changes). Still no phone, DL, blood group or emergency contact.

drop function if exists public.verify_member(uuid);

create or replace function public.verify_member(card_uid uuid)
returns table(
  display_name text,
  full_name text,
  avatar_url text,
  city text,
  member_since timestamptz,
  registered boolean,
  bike_model text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.display_name,
    rd.digital_signature,
    p.avatar_url,
    p.city,
    p.created_at,
    coalesce(rd.registered, false),
    rd.bike_model
  from public.profiles p
  left join public.rider_details rd on rd.user_id = p.id
  where p.id = card_uid;
$$;

revoke all on function public.verify_member(uuid) from public;
grant execute on function public.verify_member(uuid) to anon, authenticated;
