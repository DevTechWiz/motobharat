-- MotoBharat — Migration 003: allow PNG for URL-sourced gallery photos.
-- 0001 created gallery.mime CHECK (image/jpeg, image/webp) for the R2 upload pipeline
-- (which re-encodes everything to WebP). Admins can now add photos by pasting an
-- external https URL (06_MEDIA.md § URL-based photos); those are stored as-is, and
-- phone/screenshot exports are often PNG — widen the check.
-- File uploads still accept JPEG/WebP only (lib/media.ts); PNG rows come from URL adds.

alter table public.gallery drop constraint if exists gallery_mime_check;
alter table public.gallery add constraint gallery_mime_check
  check (mime in ('image/jpeg', 'image/webp', 'image/png'));
