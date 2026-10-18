-- MotoBharat — Migration 0018: Pillion Support
-- 1. member_type column on rider_details ('rider' | 'pillion')
-- 2. enforce_kyc_complete() trigger handles both riders and pillions
-- 3. event_members tracks rider_user_id and pillion_user_id
-- 4. event_members insert/delete policies allow riders to join with pillions
-- 5. verify_member() returns member_type
-- 6. lookup_pillion() helper for riders to find pillions by member ID

-- ── 1. member_type column ────────────────────────────────────

alter table public.rider_details
  add column if not exists member_type text not null default 'rider';

do $$ begin
  alter table public.rider_details
    add constraint rider_details_member_type_check check (member_type in ('rider', 'pillion'));
exception when duplicate_object then null;
end $$;

-- ── 2. enforce_kyc_complete trigger ──────────────────────────

create or replace function public.enforce_kyc_complete()
returns trigger
language plpgsql
as $$
declare
  photo_ok boolean;
begin
  if coalesce(new.member_type, 'rider') = 'pillion' then
    -- Pillion requirements: personal & emergency details + declaration + signature.
    -- No bike, no DL, no driving licence photo required.
    if new.registered and (
      new.age is null or new.gender is null or new.phone is null
      or new.blood_group is null or new.emergency_contact_name is null
      or new.emergency_contact_phone is null or new.emergency_contact_relation is null
      or new.declaration_confirmed is not true
      or new.digital_signature is null
    ) then
      raise exception 'KYC incomplete: required pillion safety and contact fields must be completed';
    end if;
  else
    -- Standard Rider requirements
    photo_ok := new.dl_image_url is not null
      or (old.registered is true and new.registered is true);
    if new.registered and (
      new.age is null or new.gender is null or new.phone is null
      or new.blood_group is null or new.emergency_contact_name is null
      or new.emergency_contact_phone is null or new.emergency_contact_relation is null
      or new.bike_model is null or new.bike_reg_no is null
      or new.driving_licence is null or not photo_ok
      or new.experience_level is null
      or new.gear_level is null or new.declaration_confirmed is not true
      or new.digital_signature is null
    ) then
      raise exception 'KYC incomplete: all required safety and verification fields must be completed';
    end if;
  end if;
  return new;
end;
$$;

-- ── 3. event_members columns ─────────────────────────────────

alter table public.event_members
  add column if not exists rider_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists pillion_user_id uuid references public.profiles(id) on delete set null;

-- ── 4. join gate v4: registered riders can join and bring registered pillions ──

drop policy if exists "Registered riders can join open upcoming rides" on public.event_members;

create policy "Registered riders can join open upcoming rides"
  on public.event_members for insert
  with check (
    -- Rider joining themselves
    (
      auth.uid() = user_id
      and exists (
        select 1 from public.rider_details rd
        where rd.user_id = auth.uid()
          and rd.registered = true
          and coalesce(rd.member_type, 'rider') = 'rider'
      )
    )
    or
    -- Rider adding an approved pillion
    (
      rider_user_id = auth.uid()
      and exists (
        select 1 from public.rider_details rd
        where rd.user_id = auth.uid()
          and rd.registered = true
          and coalesce(rd.member_type, 'rider') = 'rider'
      )
      and exists (
        select 1 from public.rider_details rd_p
        where rd_p.user_id = user_id
          and rd_p.registered = true
          and rd_p.member_type = 'pillion'
      )
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

-- Delete policy: riders can leave or remove their pillion; pillions can remove themselves
drop policy if exists "Users can leave rides" on public.event_members;
create policy "Users can leave rides"
  on public.event_members for delete
  using (
    auth.uid() = user_id
    or auth.uid() = rider_user_id
  );

-- ── 5. verify_member RPC ──────────────────────────────────────

drop function if exists public.verify_member(uuid);

create or replace function public.verify_member(card_uid uuid)
returns table(
  display_name text,
  full_name text,
  avatar_url text,
  city text,
  member_since timestamptz,
  registered boolean,
  bike_model text,
  member_type text
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
    rd.bike_model,
    coalesce(rd.member_type, 'rider')
  from public.profiles p
  left join public.rider_details rd on rd.user_id = p.id
  where p.id = card_uid;
$$;

revoke all on function public.verify_member(uuid) from public;
grant execute on function public.verify_member(uuid) to anon, authenticated;

-- ── 6. lookup_pillion helper RPC ──────────────────────────────

create or replace function public.lookup_pillion(pillion_code text)
returns table(
  id uuid,
  display_name text,
  full_name text,
  avatar_url text,
  blood_group text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    p.display_name,
    rd.digital_signature as full_name,
    p.avatar_url,
    rd.blood_group
  from public.profiles p
  inner join public.rider_details rd on rd.user_id = p.id
  where rd.registered = true
    and rd.member_type = 'pillion'
    and (
      replace(p.id::text, '-', '') ilike replace(replace(trim(pillion_code), 'MB-', ''), 'mb-', '') || '%'
    )
  limit 1;
$$;

revoke all on function public.lookup_pillion(text) from public;
grant execute on function public.lookup_pillion(text) to authenticated;
