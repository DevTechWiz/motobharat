-- MotoBharat — Migration 008: DL photo becomes plain KYC data
-- The licence photo + number are mandatory KYC fields like bike model — there is
-- no verification state machine. Drop dl_status / dl_verified_at / dl_verified_by
-- and the 7-day retention clock (dl_uploaded_at); the photo lives with the account.
-- registered = true now additionally requires a stored dl_image_url (trigger-level,
-- bypass-proof). verify_member() loses its dl_status field.

alter table public.rider_details
  drop column if exists dl_status,
  drop column if exists dl_verified_at,
  drop column if exists dl_verified_by,
  drop column if exists dl_uploaded_at;

-- KYC completeness now includes the licence number + stored photo.
create or replace function public.enforce_kyc_complete()returns trigger
language plpgsql
as $$
begin
  if new.registered and (
    new.age is null or new.gender is null or new.phone is null
    or new.blood_group is null or new.emergency_contact_name is null
    or new.emergency_contact_phone is null or new.emergency_contact_relation is null
    or new.bike_model is null or new.bike_reg_no is null
    or new.driving_licence is null or new.dl_image_url is null
    or new.experience_level is null
    or new.gear_level is null or new.declaration_confirmed is not true
    or new.digital_signature is null
  ) then
    raise exception 'KYC incomplete: all required safety and verification fields must be completed';
  end if;
  return new;
end;
$$;

-- Return type changes vs 0007, so REPLACE is rejected — drop first.
drop function if exists public.verify_member(uuid);

create or replace function public.verify_member(card_uid uuid)
returns table(
  display_name text,
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
