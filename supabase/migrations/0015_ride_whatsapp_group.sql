-- MotoBharat — Migration 015: per-ride WhatsApp group link
-- Allows admins to provide a dedicated WhatsApp group invite link for a ride.
-- Displayed in UI only to approved KYC members who have joined the ride.

alter table public.events
  add column if not exists whatsapp_group_url text;
