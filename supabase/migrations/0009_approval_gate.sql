-- MotoBharat — Migration 009: admin approval gate for rider KYC
-- Overrides R2 (open signup): a submitted KYC waits for admin approval before
-- the rider counts as registered. registered stays the single gate (ride joins,
-- member card, sponsor verify); kyc_submitted_at marks "filed for review" and
-- kyc_rejected marks "sent back for fixes". No production riders exist yet —
-- rows already registered count as submitted.

alter table public.rider_details
  add column if not exists kyc_submitted_at timestamptz,
  add column if not exists kyc_rejected boolean not null default false;

update public.rider_details
  set kyc_submitted_at = updated_at
  where registered = true and kyc_submitted_at is null and dl_image_url is not null;
-- Note: registered rows without a stored photo keep kyc_submitted_at null —
-- touching them would fire enforce_kyc_complete (0008 requires a photo) and
-- abort. Harmless: every status derivation checks registered first.
