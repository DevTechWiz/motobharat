import sharp from "sharp";

const MAX_BYTES = 10 * 1024 * 1024;

export interface ProcessedImage {
  data: Buffer;
  width: number;
  height: number;
}

async function sniffImage(file: File): Promise<"image/jpeg" | "image/webp" | null> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) {
    return "image/jpeg";
  }
  const isRiff =
    head.length >= 12 &&
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  return isRiff ? "image/webp" : null;
}

// Returns a human-readable error, or null when the file passes (size cap + jpeg/webp magic bytes; SVG banned).
export async function validateImageFile(file: File): Promise<string | null> {
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > MAX_BYTES) return "Image is over 10 MB — please upload a smaller file.";
  const kind = await sniffImage(file);
  if (!kind) return "Only JPEG and WebP images are allowed.";
  return null;
}

// sharp strips EXIF/metadata by default (GPS must not survive); .rotate() bakes orientation first.
export async function processImage(file: File, maxEdge: number, quality: number): Promise<ProcessedImage> {
  const input = Buffer.from(await file.arrayBuffer());
  const { data, info } = await sharp(input)
    .rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}
