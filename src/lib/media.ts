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

// Returns a human-readable error, or null when the file passes (size cap + jpeg/webp magic bytes; SVG banned).
// File uploads stay JPEG/WebP only — PNG rows exist solely for URL-added photos (06_MEDIA.md).
export async function validateImageFile(file: File): Promise<string | null> {
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > MAX_BYTES) return "Image is over 10 MB — please upload a smaller file.";
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const kind = sniffImageBuffer(head);
  if (!kind || kind === "image/png") return "Only JPEG and WebP images are allowed.";
  return null;
}

// sharp strips EXIF/metadata by default (GPS must not survive); .rotate() bakes orientation first.
export async function processImage(file: File, maxEdge: number, quality: number): Promise<ProcessedImage> {
  const input = Buffer.from(await file.arrayBuffer());
  const { default: sharp } = await import("sharp");
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
