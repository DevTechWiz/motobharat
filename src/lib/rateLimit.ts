const buckets = new Map<string, number[]>();

export type RateLimit = { max: number; windowMs: number };

// Limits from docs/07_SECURITY.md — in-process sliding window (v0.2; single instance only).
export const RATE_LIMITS = {
  rideJoinLeave: { max: 30, windowMs: 3_600_000 },
  profile: { max: 10, windowMs: 3_600_000 },
  admin: { max: 60, windowMs: 60_000 },
} as const;

export function rateLimit(action: string, userId: string, limit: RateLimit): boolean {
  if (process.env.NODE_ENV === "development") return true;
  const key = `${action}:${userId}`;
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < limit.windowMs);
  if (hits.length >= limit.max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}
