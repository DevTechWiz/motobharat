-- MotoBharat — Migration 006: DL document verification
-- Licence photo upload for admin cross-check (name on DL vs signature).
-- Images auto-purge 7 days after upload (lazy, on read — lib/rider-docs.ts);
-- verification status survives the purge. enforce_kyc_complete is untouched:
-- registration still flips on submit, verification is post-hoc admin review.

alter table public.rider_details
  add column if not exists dl_image_url text,
  add column if not exists dl_status text not null default 'pending'
    check (dl_status in ('pending', 'verified', 'rejected')),
  add column if not exists dl_uploaded_at timestamptz,
  add column if not exists dl_verified_at timestamptz,
  add column if not exists dl_verified_by uuid references public.profiles(id);
