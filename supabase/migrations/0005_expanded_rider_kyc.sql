-- MotoBharat — Migration 005: expanded rider registration & KYC fields
-- Adds comprehensive motorcycle, licensing, emergency safety, and indemnity fields.

alter table public.rider_details
  add column if not exists dob date,
  add column if not exists whatsapp_number text,
  add column if not exists permanent_address text,
  add column if not exists bike_reg_no text,
  add column if not exists driving_licence text,
  add column if not exists experience_level text check (experience_level in ('beginner', 'intermediate', 'experienced')),
  add column if not exists gear_level text check (gear_level in ('helmet_only', 'basic', 'full_armored')),
  add column if not exists vehicle_insurance_status text check (vehicle_insurance_status in ('valid_insured', 'expired', 'none')),
  add column if not exists medical_conditions text,
  add column if not exists personal_health_insurance boolean not null default false,
  add column if not exists has_rsa boolean not null default false,
  add column if not exists rides_with_pillion boolean not null default false,
  add column if not exists instagram_handle text,
  add column if not exists occupation text,
  add column if not exists emergency_contact_relation text,
  add column if not exists emergency_contact_2_phone text,
  add column if not exists referral_source text,
  add column if not exists suggestions text,
  add column if not exists declaration_confirmed boolean not null default false,
  add column if not exists digital_signature text;

-- Update the enforce_kyc_complete trigger to enforce mandatory safety and verification fields
create or replace function public.enforce_kyc_complete()
returns trigger
language plpgsql
as $$
begin
  if new.registered and (
    new.age is null or new.gender is null or new.phone is null
    or new.blood_group is null or new.emergency_contact_name is null
    or new.emergency_contact_phone is null or new.emergency_contact_relation is null
    or new.bike_model is null or new.bike_reg_no is null
    or new.driving_licence is null or new.experience_level is null
    or new.gear_level is null or new.declaration_confirmed is not true
    or new.digital_signature is null
  ) then
    raise exception 'KYC incomplete: all required safety and verification fields must be completed';
  end if;
  return new;
end;
$$;
