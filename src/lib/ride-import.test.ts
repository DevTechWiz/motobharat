import { describe, it, expect } from "vitest";
import { parseRideImport, RIDE_IMPORT_TEMPLATE } from "./ride-import";

const FULL = `{
  "title": "Sunday Lakeside Run",
  "description": "Easy morning ride.",
  "starts_at": "2026-10-25T06:00",
  "meeting_point": "Hanamkonda Fuel Station",
  "destination": "Laknavaram Lake",
  "distance_km": 120,
  "difficulty": "easy",
  "status": "published",
  "activities": ["Photography", "Chai"],
  "itinerary": [{ "title": "Assemble", "description": "Gear check." }]
}`;

describe("parseRideImport", () => {
  it("fills every known field from a complete payload", () => {
    const r = parseRideImport(FULL);
    expect(r.ok).toBe(true);
    expect(r.values.title).toBe("Sunday Lakeside Run");
    expect(r.values.starts_at).toBe("2026-10-25T06:00");
    expect(r.values.distance_km).toBe(120);
    expect(r.values.difficulty).toBe("easy");
    expect(r.values.status).toBe("published");
    expect(r.values.activities).toEqual(["Photography", "Chai"]);
    expect(r.values.itinerary).toEqual([{ title: "Assemble", description: "Gear check." }]);
    expect(r.skipped).toEqual([]);
    expect(r.ignored).toEqual([]);
  });

  it("accepts a title-only payload (draft-friendly partial fill)", () => {
    const r = parseRideImport(`{ "title": "Monsoon Ghats" }`);
    expect(r.ok).toBe(true);
    expect(r.values).toEqual({ title: "Monsoon Ghats" });
    expect(r.filled).toEqual(["Title"]);
  });

  it("rejects non-JSON with a friendly error and fills nothing", () => {
    const r = parseRideImport("{ title: oops, }");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/valid JSON/);
    expect(r.values).toEqual({});
  });

  it("rejects empty input and non-object top levels", () => {
    expect(parseRideImport("   ").ok).toBe(false);
    expect(parseRideImport("[1,2]").ok).toBe(false);
    expect(parseRideImport("[1,2]").error).toMatch(/object/);
  });

  it("ignores unknown keys and reports them", () => {
    const r = parseRideImport(`{ "title": "X", "foo": 1, "bar": 2 }`);
    expect(r.ok).toBe(true);
    expect(r.values.title).toBe("X");
    expect(r.ignored).toEqual(["foo", "bar"]);
  });

  it("skips invalid enums/dates but keeps the valid fields", () => {
    const r = parseRideImport(
      `{ "title": "X", "difficulty": "extreme", "starts_at": "not-a-date", "distance_km": -5 }`
    );
    expect(r.ok).toBe(true);
    expect(r.values.title).toBe("X");
    expect(r.values.difficulty).toBeUndefined();
    expect(r.values.starts_at).toBeUndefined();
    expect(r.values.distance_km).toBeUndefined();
    expect(r.skipped.map((s) => s.field).sort()).toEqual(["difficulty", "distance_km", "starts_at"]);
  });

  it("normalizes full ISO datetimes to IST datetime-local shape", () => {
    const r = parseRideImport(`{ "title": "X", "starts_at": "2026-10-25T00:30:00.000Z" }`);
    expect(r.ok).toBe(true);
    expect(r.values.starts_at).toBe("2026-10-25T06:00");
  });

  it("strips comment lines so the template parses", () => {
    const r = parseRideImport(`{\n// a hint\n"title": "X", /* inline */ "distance_km": 40\n}`);
    expect(r.ok).toBe(true);
    expect(r.values).toEqual({ title: "X", distance_km: 40 });
  });

  it("defers cover_url to the photo picker with a notice", () => {
    const r = parseRideImport(`{ "title": "X", "cover_url": "https://example.com/c.jpg" }`);
    expect(r.ok).toBe(true);
    expect("cover_url" in r.values).toBe(false);
    expect(r.skipped.map((s) => s.field)).toContain("cover_url");
  });

  it("drops itinerary stops without a title", () => {
    const r = parseRideImport(
      `{ "title": "X", "itinerary": [{ "description": "no title" }, { "title": "Assemble" }] }`
    );
    expect(r.ok).toBe(true);
    expect(r.values.itinerary).toEqual([{ title: "Assemble" }]);
  });

  it("parses the shipped template, trailing comments included", () => {
    const r = parseRideImport(RIDE_IMPORT_TEMPLATE);
    expect(r.ok).toBe(true);
    expect(r.values.title).toBe("Sunday Lakeside Run");
    expect(r.values.difficulty).toBe("easy");
    expect(r.values.itinerary).toHaveLength(2);
    expect(r.skipped).toEqual([]);
  });

  it("keeps // inside string values (e.g. URLs) intact", () => {
    const r = parseRideImport(
      `{ "title": "X", "description": "see https://example.com/route // not a comment" }`
    );
    expect(r.ok).toBe(true);
    expect(r.values.description).toBe("see https://example.com/route // not a comment");
  });
});
