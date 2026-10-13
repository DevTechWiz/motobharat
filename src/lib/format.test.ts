import { describe, expect, it } from "vitest";
import { ageFromDob } from "./format";

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
