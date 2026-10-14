import { toDatetimeLocalIST } from "./format";
import type { EventStatus, RideDifficulty } from "./types";

export interface RideImportItineraryItem {
  title: string;
  description?: string;
  activity?: string;
}

export interface RideImport {
  title?: string;
  description?: string;
  /** Normalized `datetime-local` shape (IST wall time): YYYY-MM-DDTHH:mm */
  starts_at?: string;
  meeting_point?: string;
  destination?: string;
  distance_km?: number | null;
  difficulty?: RideDifficulty;
  status?: EventStatus;
  activities?: string[];
  itinerary?: RideImportItineraryItem[];
}

export interface RideImportSkip {
  field: string;
  reason: string;
}

export interface RideImportResult {
  /** False only when the input is not JSON or not an object — nothing is filled. */
  ok: boolean;
  error?: string;
  values: RideImport;
  filled: string[];
  skipped: RideImportSkip[];
  /** Keys that are not ride fields. */
  ignored: string[];
}

const KNOWN_KEYS = new Set([
  "title",
  "description",
  "starts_at",
  "meeting_point",
  "destination",
  "distance_km",
  "difficulty",
  "status",
  "activities",
  "itinerary",
  "cover_url",
]);

const DIFFICULTIES: RideDifficulty[] = ["easy", "moderate", "hard"];
const STATUSES: EventStatus[] = ["draft", "published", "completed", "cancelled"];

// Comment-tolerant JSON: strips // and /* */ comments anywhere outside string
// literals, so the shipped template can carry inline field hints without
// breaking parsing — and https:// inside a value is never touched.
function stripJsonComments(raw: string): string {
  let out = "";
  let i = 0;
  let inString = false;
  let quote = "";
  while (i < raw.length) {
    const c = raw[i];
    const next = raw[i + 1];
    if (inString) {
      out += c;
      if (c === "\\" && i + 1 < raw.length) {
        out += raw[i + 1];
        i += 2;
        continue;
      }
      if (c === quote) inString = false;
      i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      quote = c;
      out += c;
      i += 1;
      continue;
    }
    if (c === "/" && next === "/") {
      while (i < raw.length && raw[i] !== "\n") i += 1;
      continue;
    }
    if (c === "/" && next === "*") {
      i += 2;
      while (i < raw.length && !(raw[i] === "*" && raw[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

function asTrimmedString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function normalizeStartsAt(v: unknown): { value?: string; reason?: string } {
  const s = asTrimmedString(v);
  if (!s) return { reason: "empty — skipped" };
  // Already datetime-local shaped (IST wall time, same as the form input).
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    const d = new Date(s.length === 16 ? `${s}:00` : s);
    if (isNaN(d.getTime())) return { reason: `"${s}" is not a real date — skipped` };
    return { value: s.slice(0, 16) };
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return { reason: `"${s}" is not a date — skipped` };
  return { value: toDatetimeLocalIST(s) };
}

export function parseRideImport(raw: string): RideImportResult {
  const empty: RideImportResult = { ok: false, values: {}, filled: [], skipped: [], ignored: [] };
  if (!raw.trim()) return { ...empty, error: "Paste JSON first — the box is empty." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonComments(raw));
  } catch {
    return { ...empty, error: "Not valid JSON — check commas, quotes and brackets." };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ...empty, error: "Top level must be an object, e.g. { \"title\": \"…\" }." };
  }

  const input = parsed as Record<string, unknown>;
  const values: RideImport = {};
  const filled: string[] = [];
  const skipped: RideImportSkip[] = [];
  const ignored = Object.keys(input).filter((k) => !KNOWN_KEYS.has(k));
  const skip = (field: string, reason: string) => skipped.push({ field, reason });

  const title = asTrimmedString(input.title);
  if (title) {
    if (title.length > 100) skip("title", "over 100 characters — skipped");
    else {
      values.title = title;
      filled.push("Title");
    }
  }

  const description = typeof input.description === "string" ? input.description.trim() : null;
  if (description) {
    if (description.length > 2000) skip("description", "over 2000 characters — skipped");
    else {
      values.description = description;
      filled.push("Description");
    }
  }

  if (input.starts_at !== undefined) {
    const norm = normalizeStartsAt(input.starts_at);
    if (norm.value) {
      values.starts_at = norm.value;
      filled.push("Starts at");
    } else {
      skip("starts_at", norm.reason ?? "unusable — skipped");
    }
  }

  const meetingPoint = asTrimmedString(input.meeting_point);
  if (meetingPoint) {
    values.meeting_point = meetingPoint;
    filled.push("Meeting point");
  }

  const destination = asTrimmedString(input.destination);
  if (destination) {
    values.destination = destination;
    filled.push("Destination");
  }

  if (input.distance_km !== undefined && input.distance_km !== null && input.distance_km !== "") {
    const n = typeof input.distance_km === "number" ? input.distance_km : Number(String(input.distance_km).trim());
    if (Number.isFinite(n) && n > 0) {
      values.distance_km = n;
      filled.push("Distance");
    } else {
      skip("distance_km", "must be a number above 0 — skipped");
    }
  }

  if (input.difficulty !== undefined) {
    const d = asTrimmedString(input.difficulty)?.toLowerCase();
    if (d && (DIFFICULTIES as string[]).includes(d)) {
      values.difficulty = d as RideDifficulty;
      filled.push("Difficulty");
    } else {
      skip("difficulty", "must be easy, moderate or hard — skipped");
    }
  }

  if (input.status !== undefined) {
    const s = asTrimmedString(input.status)?.toLowerCase();
    if (s && (STATUSES as string[]).includes(s)) {
      values.status = s as EventStatus;
      filled.push("Status");
    } else {
      skip("status", "must be draft, published, completed or cancelled — kept draft");
    }
  }

  if (input.activities !== undefined) {
    if (Array.isArray(input.activities)) {
      const acts = input.activities
        .filter((a): a is string => typeof a === "string" && !!a.trim())
        .map((a) => a.trim());
      if (acts.length > 0) {
        values.activities = acts;
        filled.push(`Activities (${acts.length})`);
      } else {
        skip("activities", "no usable tags — skipped");
      }
    } else {
      skip("activities", "must be an array of strings — skipped");
    }
  }

  if (input.itinerary !== undefined) {
    if (Array.isArray(input.itinerary)) {
      const stops: RideImportItineraryItem[] = input.itinerary
        .filter(
          (item): item is Record<string, unknown> =>
            typeof item === "object" && item !== null && !!asTrimmedString((item as Record<string, unknown>).title)
        )
        .map((item) => {
          const rec = item as Record<string, unknown>;
          const stop: RideImportItineraryItem = { title: (rec.title as string).trim() };
          const desc = asTrimmedString(rec.description);
          const act = asTrimmedString(rec.activity);
          if (desc) stop.description = desc;
          if (act) stop.activity = act;
          return stop;
        });
      if (stops.length > 0) {
        values.itinerary = stops;
        filled.push(`Itinerary (${stops.length} ${stops.length === 1 ? "stop" : "stops"})`);
      } else {
        skip("itinerary", "no stops with a title — skipped");
      }
    } else {
      skip("itinerary", "must be an array — skipped");
    }
  }

  if (input.cover_url !== undefined && asTrimmedString(input.cover_url)) {
    skip("cover_url", "covers are upload-only at create — use the photo picker");
  }

  return { ok: true, values, filled, skipped, ignored };
}

export const RIDE_IMPORT_TEMPLATE = `{
  // Ride details — delete any line you don't need. Unknown keys are ignored.
  "title": "Sunday Lakeside Run",
  "description": "Easy-paced morning ride with a chai halt halfway.",
  "starts_at": "2026-10-25T06:00", // IST, YYYY-MM-DDTHH:mm
  "meeting_point": "Hanamkonda Fuel Station",
  "destination": "Laknavaram Lake",
  "distance_km": 120,
  "difficulty": "easy", // easy | moderate | hard
  "status": "draft", // draft | published | completed | cancelled
  "activities": ["Photography", "Breakfast / Chai"],
  "itinerary": [
    { "title": "Assemble & briefing", "description": "06:00 sharp, gear check." },
    { "title": "Chai halt", "description": "Laknavaram viewpoint.", "activity": "Photography" }
  ]
}
`;
