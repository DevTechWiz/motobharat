import { afterEach, describe, expect, it, vi } from "vitest";
import { RATE_LIMITS, rateLimit } from "./rateLimit";

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows up to max, blocks the next attempt", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 30; i++) {
      expect(rateLimit("rl-a", "user1", { max: 30, windowMs: 3_600_000 })).toBe(true);
    }
    expect(rateLimit("rl-a", "user1", { max: 30, windowMs: 3_600_000 })).toBe(false);
  });

  it("allows again after the window slides past", () => {
    vi.useFakeTimers();
    const limit = { max: 2, windowMs: 60_000 };
    expect(rateLimit("rl-b", "user1", limit)).toBe(true);
    expect(rateLimit("rl-b", "user1", limit)).toBe(true);
    expect(rateLimit("rl-b", "user1", limit)).toBe(false);
    vi.advanceTimersByTime(60_001);
    expect(rateLimit("rl-b", "user1", limit)).toBe(true);
  });

  it("keeps buckets separate per action and user", () => {
    vi.useFakeTimers();
    const limit = { max: 1, windowMs: 3_600_000 };
    expect(rateLimit("rl-c", "user1", limit)).toBe(true);
    expect(rateLimit("rl-c", "user1", limit)).toBe(false);
    expect(rateLimit("rl-c", "user2", limit)).toBe(true);
    expect(rateLimit("rl-d", "user1", limit)).toBe(true);
  });

  it("ships the documented defaults", () => {
    expect(RATE_LIMITS.rideJoinLeave).toEqual({ max: 30, windowMs: 3_600_000 });
    expect(RATE_LIMITS.profile).toEqual({ max: 10, windowMs: 3_600_000 });
    expect(RATE_LIMITS.admin).toEqual({ max: 60, windowMs: 60_000 });
  });
});
