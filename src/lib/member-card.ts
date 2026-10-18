// Member ID card helpers (docs 00_OVERVIEW R8, 01_SCHEMA verify_member).
// Member IDs are derived from the user uuid — no column, deterministic.
// The verify URL carries the full uuid (unguessable); the MB-XXXXXX ID is display-only.
export const SITE_BASE = "https://motobharat.co";

export const MEMBER_ID_PREFIX = "MB";
export const MEMBER_ID_LEN = 6;

export interface VerifiedMember {
  display_name: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  member_since: string;
  registered: boolean;
  bike_model: string | null;
  member_type?: string | null;
}

// First 6 hex chars of the uuid (dashes stripped), uppercased: MB-XXXXXX.
export function memberIdFromUserId(userId: string): string {
  const hex = userId.replace(/-/g, "").slice(0, MEMBER_ID_LEN).toUpperCase();
  return `${MEMBER_ID_PREFIX}-${hex}`;
}

export function verifyUrlForUser(userId: string, base: string = SITE_BASE): string {
  return `${base.replace(/\/$/, "")}/verify/${userId}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
