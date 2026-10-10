-- MotoBharat — Migration 002: rider KYC (private safety details + join gate)
-- rider_details: PII (age, blood group, emergency contact) — own + admin only, never public.
-- Join gate: event_members insert requires rider_details.registered = true (DB-level).

-- ── rider_details ──────────────────────────────────────

create table public.rider_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  age int check (age between 18 and 90),
  gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  phone text,
  blood_group text check (blood_group in ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')),
  emergency_contact_name text,
  emergency_contact_phone text,
  bike_model text,
  registered boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.rider_details enable row level security;

create policy "Users can view own rider details"
  on public.rider_details for select
  using (auth.uid() = user_id or auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

create policy "Users can insert own rider details"
  on public.rider_details for insert
  with check (auth.uid() = user_id);

create policy "Users can update own rider details"
  on public.rider_details for update
  using (auth.uid() = user_id or auth.uid() in (
    select id from public.profiles where role = 'admin'
  ));

-- registered can only be true when every KYC field is filled (blocks raw-API self-promotion).
create or replace function public.enforce_kyc_complete()
returns trigger
language plpgsql
as $$
begin
  if new.registered and (
    new.age is null or new.gender is null or new.phone is null
    or new.blood_group is null or new.emergency_contact_name is null
    or new.emergency_contact_phone is null or new.bike_model is null
  ) then
    raise exception 'KYC incomplete';
  end if;
  return new;
end;
$$;

create trigger rider_details_kyc_check
  before insert or update on public.rider_details
  for each row execute function public.enforce_kyc_complete();

-- ── join gate: replace open insert policy ──────────────

drop policy "Users can join rides" on public.event_members;

create policy "Registered riders can join rides"
  on public.event_members for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.rider_details rd
      where rd.user_id = auth.uid() and rd.registered = true
    )
  );
