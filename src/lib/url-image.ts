import { lookup } from "node:dns/promises";
import { extractDriveFileId, normalizeImageUrl } from "@/lib/image-link";
import { parseImageDimensions, sniffImageBuffer, type ImageMime } from "@/lib/media";

const MAX_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 10_000;
const OVERALL_MS = 15_000;
const MAX_REDIRECTS = 3;
const MAX_EDGE = 10_000;

// Pure guard — blocks loopback / RFC1918 / link-local / CGNAT / IPv6 loopback+ULA+LL+multicast.
// Exported for unit tests (url-image.test.ts).
export function isBlockedIp(ip: string): boolean {
  const bare = ip.toLowerCase();
  const mapped = bare.startsWith("::ffff:") ? bare.slice(7) : bare;
  if (mapped.includes(".")) {
    const parts = mapped.split(".").map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a === 0 || a === 127 || a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (bare === "::1" || bare === "::") return true;
  if (!bare.includes(":")) return true;
  if (/^f[cd]/.test(bare)) return true;
  if (/^fe[89ab]/.test(bare)) return true;
  if (/^ff/.test(bare)) return true;
  return false;
}

export type UrlImageInfo = {
  url: string;
  thumbUrl: string;
  mime: ImageMime;
  width: number;
  height: number;
};


export type UrlImageResult = { ok: true; info: UrlImageInfo } | { ok: false; error: string };

async function guardUrl(u: URL): Promise<string | null> {
  if (u.protocol !== "https:") return "Only https:// image links are allowed.";
  if (u.username || u.password) return "Image links must not contain credentials.";
  if (u.port && u.port !== "443") return "Only standard https links are allowed.";
  let addrs: { address: string }[];
  try {
    addrs = await lookup(u.hostname, { all: true });
  } catch {
    return "Could not resolve the link's host.";
  }
  if (addrs.length === 0 || addrs.some((a) => isBlockedIp(a.address))) {
    return "That host isn't allowed.";
  }
  return null;
}

// SSRF-safe fetch of an external image: https-only, DNS-checked (private ranges blocked),
// ≤3 redirect hops re-validated, 10 s per-attempt fetch timeout, 15 s overall deadline
// covering the stream phase, 10 MB stream cap, magic-byte sniff, sharp metadata.
// Never throws: every failure (including aborts and hangs) returns { ok: false }
// so a hostile/slow host can neither hang the action nor 500 it.
export async function validateExternalImageUrl(raw: string): Promise<UrlImageResult> {
  try {
    return await validateWithDeadline(raw);
  } catch {
    return { ok: false, error: "Could not verify that link — check it and try again." };
  }
}

async function validateWithDeadline(raw: string): Promise<UrlImageResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OVERALL_MS);
  try {
    return await validateInner(raw, ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function validateInner(raw: string, deadline: AbortSignal): Promise<UrlImageResult> {
  // Drive viewer links are share pages, not images — normalize first so the
  // fetch below hits bytes. Guard/SSRF checks still run on the final host.
  let current = normalizeImageUrl(raw.trim());
  if (!current) return { ok: false, error: "Paste an image URL first." };

  let response: Response | null = null;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      return { ok: false, error: "That doesn't look like a valid URL." };
    }
    const blocked = await guardUrl(url);
    if (blocked) return { ok: false, error: blocked };

    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { Accept: "image/*" },
    }).catch(() => null);
    if (!res) return { ok: false, error: "Could not fetch that link." };

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      res.body?.cancel().catch(() => {});
      if (!loc) return { ok: false, error: "The link redirected without a destination." };
      current = new URL(loc, url).toString();
      continue;
    }
    if (!res.ok) {
      res.body?.cancel().catch(() => {});
      return { ok: false, error: `The image host responded with status ${res.status}.` };
    }
    response = res;
    break;
  }
  if (!response) return { ok: false, error: "Too many redirects." };

  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > MAX_BYTES) {
    response.body?.cancel().catch(() => {});
    return { ok: false, error: "Image is over 10 MB — use a smaller image." };
  }

  const reader = response.body?.getReader();
  if (!reader) return { ok: false, error: "The link returned no image data." };
  // A stuck socket makes reader.read() hang past every fetch timeout — race
  // each read against the overall deadline.
  const timedOut: Promise<never> = new Promise((_, reject) => {
    if (deadline.aborted) reject(new Error("image load timed out"));
    else deadline.addEventListener("abort", () => reject(new Error("image load timed out")), { once: true });
  });
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    let read: ReadableStreamReadResult<Uint8Array>;
    try {
      read = await Promise.race([reader.read(), timedOut]);
    } catch {
      await reader.cancel().catch(() => {});
      return { ok: false, error: "The image took too long to load — try a smaller image or a faster host." };
    }
    const { done, value } = read;
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel().catch(() => {});
      return { ok: false, error: "Image is over 10 MB — use a smaller image." };
    }
    chunks.push(value);
  }
  const buffer = Buffer.concat(chunks);
  if (buffer.length < 16) return { ok: false, error: "The link returned no image data." };

  const mime = sniffImageBuffer(buffer.subarray(0, 16));
  if (!mime) {
    const served = response.headers.get("content-type") ?? "";
    if (served.includes("text/html")) {
      return {
        ok: false,
        error: "That link opened a web page, not an image file. Open the image itself (or for Drive: Anyone-with-the-link → paste the share link) and try again.",
      };
    }
    return { ok: false, error: "That link doesn't point to a JPEG, WebP or PNG image." };
  }

  let meta: { width?: number; height?: number } | null = null;
  try {
    // Lazy: sharp is Node-native and must never be a static import on Workers.
    const { default: sharp } = await import("sharp");
    meta = await sharp(buffer).metadata();
  } catch {
    meta = parseImageDimensions(new Uint8Array(buffer));
  }
  if (!meta) {
    return { ok: false, error: "The image could not be read." };
  }
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) return { ok: false, error: "The image has no readable dimensions." };
  if (Math.max(width, height) > MAX_EDGE) {
    return { ok: false, error: "Image dimensions are too large (max 10,000 px)." };
  }

  const driveId = extractDriveFileId(raw) ?? extractDriveFileId(current);
  let finalUrl = current;
  let thumbUrl = current;

  if (driveId) {
    // Only compress via Google CDN if the image is heavy (> 500 KB or > 1600 px)
    const isHeavy = buffer.length > 500 * 1024 || Math.max(width, height) > 1600;
    finalUrl = isHeavy
      ? `https://lh3.googleusercontent.com/d/${driveId}=s1600-rw`
      : `https://lh3.googleusercontent.com/d/${driveId}`;

    // Thumbnails: compress to 400px WebP if larger than thumbnail scale
    thumbUrl = Math.max(width, height) > 400 || buffer.length > 150 * 1024
      ? `https://lh3.googleusercontent.com/d/${driveId}=w400-rw`
      : finalUrl;
  }

  return { ok: true, info: { url: finalUrl, thumbUrl, mime, width, height } };
}

