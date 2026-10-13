-- MotoBharat — Migration 007: public member-card verification
-- Sponsors scan the card QR -> /verify/[uid]. The page needs registered/dl_status
-- of OTHER users, which RLS (rider_details own+admin only) can never return.
-- So: a SECURITY DEFINER function exposing only the six card-safe fields.
-- Phone, DL number, blood group and emergency contacts never leave the DB.

create or replace function public.verify_member(card_uid uuid)
returns table(
  display_name text,
  avatar_url text,
  city text,
  member_since timestamptz,
  registered boolean,
  dl_status text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.display_name,
    p.avatar_url,
    p.city,
    p.created_at,
    coalesce(rd.registered, false),
    coalesce(rd.dl_status, 'pending')
  from public.profiles p
  left join public.rider_details rd on rd.user_id = p.id
  where p.id = card_uid;
$$;

revoke all on function public.verify_member(uuid) from public;
grant execute on function public.verify_member(uuid) to anon, authenticated;
