import { describe, expect, it } from "vitest";
import { ageFromDob, tenureSince } from "./format";

describe("ageFromDob", () => {
  it("computes whole-year age from a date of birth", () => {
    expect(ageFromDob("2000-06-15", new Date("2026-10-13T00:00:00"))).toBe(26);
  });

  it("subtracts a year when this year's birthday hasn't happened yet", () => {
    expect(ageFromDob("2000-12-01", new Date("2026-10-13T00:00:00"))).toBe(25);
  });

  it("counts a birthday happening today", () => {
    expect(ageFromDob("2008-10-13", new Date("2026-10-13T00:00:00"))).toBe(18);
  });

  it("returns null for empty or unparseable input", () => {
    expect(ageFromDob("")).toBe(null);
    expect(ageFromDob("not-a-date")).toBe(null);
  });
});

describe("tenureSince", () => {
  const NOW = new Date("2026-10-14T00:00:00");

  it("reports months within the first year", () => {
    expect(tenureSince("2026-02-14", NOW)).toBe("8 mo");
    expect(tenureSince("2026-09-14", NOW)).toBe("1 mo");
  });

  it("reports years and remaining months", () => {
    expect(tenureSince("2024-08-14", NOW)).toBe("2 yr 2 mo");
    expect(tenureSince("2025-10-14", NOW)).toBe("1 yr");
  });

  it("says new member inside the first month", () => {
    expect(tenureSince("2026-10-01", NOW)).toBe("new member");
  });

  it("returns null for empty, unparseable or future input", () => {
    expect(tenureSince("", NOW)).toBe(null);
    expect(tenureSince("not-a-date", NOW)).toBe(null);
    expect(tenureSince("2027-01-01", NOW)).toBe(null);
  });
});
