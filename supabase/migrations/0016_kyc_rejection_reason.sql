-- MotoBharat — Migration 016: KYC rejection reason
-- Admins record why a rider's KYC was rejected; the rider sees it on /profile/kyc.
-- Cleared (null) when the rider resubmits the KYC for review.

alter table public.rider_details
  add column if not exists rejection_reason text;
