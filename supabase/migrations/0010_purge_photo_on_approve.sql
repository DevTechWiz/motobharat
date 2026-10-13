-- MotoBharat — Migration 010: DL photo purged at approval
-- The licence photo exists only to get verified. Once a rider is approved the
-- photo is deleted (approveRider nulls the column + removes the R2 object) and
-- must never be required again. The trigger keeps demanding a stored photo for
-- NEW approvals, but exempts rows that are already registered: nulling the
-- photo on an approved row is the purge, not a KYC violation. (OLD is null on
-- INSERT, where field access yields null — new rows still need the photo.)

create or replace function public.enforce_kyc_complete()
returns trigger
language plpgsql
as $$
declare
  photo_ok boolean;
begin
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
  return new;
end;
$$;
