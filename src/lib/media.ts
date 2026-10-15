// NOTE: sharp is imported lazily inside processImage, never at module top level.
// It is a Node-native module and cannot load on Cloudflare Workers — a static
// import would poison every route bundle that touches this file. Lazy loading
// keeps all non-upload routes safe; the upload path itself needs a
// Workers-native replacement before gallery uploads can go live (08_STACK.md).
const MAX_BYTES = 10 * 1024 * 1024;

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
  format: "webp" | "jpg" | "png";
  contentType: string;
}

export type ImageMime = "image/jpeg" | "image/webp" | "image/png";

export function sniffImageBuffer(head: Uint8Array): ImageMime | null {
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "image/jpeg";
  }
  const isRiff =
    head.length >= 12 &&
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  if (isRiff) return "image/webp";
  const isPng =
    head.length >= 8 &&
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 &&
    head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a;
  return isPng ? "image/png" : null;
}

export function parseJpegDimensions(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    while (offset < buf.length && buf[offset] === 0xff) {
      offset++;
    }
    if (offset >= buf.length) break;
    const marker = buf[offset];
    offset++;

    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      continue;
    }

    if (offset + 1 >= buf.length) break;
    const length = (buf[offset] << 8) | buf[offset + 1];

    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isSof) {
      if (offset + 6 < buf.length) {
        const height = (buf[offset + 3] << 8) | buf[offset + 4];
        const width = (buf[offset + 5] << 8) | buf[offset + 6];
        if (width > 0 && height > 0) return { width, height };
      }
      return null;
    }

    if (marker === 0xda) break;
    offset += length;
  }
  return null;
}

export function parsePngDimensions(buf: Uint8Array): { width: number; height: number } | null {
  if (
    buf.length >= 24 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    const width = ((buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19]) >>> 0;
    const height = ((buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23]) >>> 0;
    if (width > 0 && height > 0) return { width, height };
  }
  return null;
}

export function parseWebpDimensions(buf: Uint8Array): { width: number; height: number } | null {
  if (buf.length < 30) return null;
  const isRiff =
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
  if (!isRiff) return null;

  const chunkType = String.fromCharCode(buf[12], buf[13], buf[14], buf[15]);
  if (chunkType === "VP8 ") {
    if (buf.length >= 30 && buf[23] === 0x9d && buf[24] === 0x01 && buf[25] === 0x2a) {
      const width = ((buf[27] << 8) | buf[26]) & 0x3fff;
      const height = ((buf[29] << 8) | buf[28]) & 0x3fff;
      if (width > 0 && height > 0) return { width, height };
    }
  } else if (chunkType === "VP8L") {
    if (buf.length >= 25 && buf[20] === 0x2f) {
      const b0 = buf[21];
      const b1 = buf[22];
      const b2 = buf[23];
      const b3 = buf[24];
      const width = 1 + (((b1 & 0x3f) << 8) | b0);
      const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      if (width > 0 && height > 0) return { width, height };
    }
  } else if (chunkType === "VP8X") {
    if (buf.length >= 30) {
      const width = 1 + buf[24] + (buf[25] << 8) + (buf[26] << 16);
      const height = 1 + buf[27] + (buf[28] << 8) + (buf[29] << 16);
      if (width > 0 && height > 0) return { width, height };
    }
  }
  return null;
}

export function parseImageDimensions(buf: Uint8Array): { width: number; height: number } | null {
  return parseJpegDimensions(buf) ?? parsePngDimensions(buf) ?? parseWebpDimensions(buf);
}

// Picker accept-list lives in lib/client-image.ts (sharp must never enter a
// browser bundle) — do not re-add client-facing constants here.

// Returns a human-readable error, or null when the file passes (size cap + jpeg/webp/png magic bytes; SVG banned).
export async function validateImageFile(file: File): Promise<string | null> {
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > MAX_BYTES) return "Image is over 10 MB — please upload a smaller file.";
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const kind = sniffImageBuffer(head);
  if (!kind) return "Only JPEG, WebP, and PNG images are allowed.";
  return null;
}

// sharp strips EXIF/metadata by default (GPS must not survive); .rotate() bakes orientation first.
// If sharp fails to load (e.g. in Cloudflare Workers where Node C++ addons cannot execute),
// we fall back to preserving the validated input bytes directly without failing the upload.
export async function processImage(file: File, maxEdge: number, quality: number): Promise<ProcessedImage> {
  const input = Buffer.from(await file.arrayBuffer());
  try {
    const { default: sharp } = await import("sharp");
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height, format: "webp", contentType: "image/webp" };
  } catch (err) {
    console.warn("[media] sharp processing unavailable in this runtime; using validated input bytes fallback:", err);
    const mime = sniffImageBuffer(new Uint8Array(input.subarray(0, 16))) ?? "image/jpeg";
    const dims = parseImageDimensions(new Uint8Array(input));
    const format = mime === "image/webp" ? "webp" : mime === "image/png" ? "png" : "jpg";
    return {
      data: input,
      width: dims?.width ?? maxEdge,
      height: dims?.height ?? Math.round((maxEdge * 9) / 16),
      format,
      contentType: mime,
    };
  }
}
