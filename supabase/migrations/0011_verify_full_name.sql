-- MotoBharat — Migration 011: sponsor verify shows the legal full name
-- The member ID card carries digital_signature (fallback: display_name); the
-- public verify page must show the same name or sponsors compare two different
-- strings. Return type changes, so drop first (same lesson as 0008).

drop function if exists public.verify_member(uuid);

create or replace function public.verify_member(card_uid uuid)
returns table(
  display_name text,
  full_name text,
  avatar_url text,
  city text,
  member_since timestamptz,
  registered boolean
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
    coalesce(rd.registered, false)
  from public.profiles p
  left join public.rider_details rd on rd.user_id = p.id
  where p.id = card_uid;
$$;

revoke all on function public.verify_member(uuid) from public;
grant execute on function public.verify_member(uuid) to anon, authenticated;
