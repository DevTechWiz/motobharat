// Browser-side image prep, shared by every file-upload surface (gallery, DL
// picker, avatar; covers arrive pre-framed from the cropper). Downscale +
// JPEG re-encode before upload so R2 objects stay small even where sharp
// can't run (the Workers fallback stores input bytes), EXIF/GPS never leaves
// the device, and users never hit the 10 MB server cap.
//
// Upload accept-list also lives here — NOT in lib/media.ts — on purpose:
// media.ts pulls in sharp, which must never enter a browser bundle.
// Importing media.ts from a "use client" module breaks the production build
// (sharp's native deps can't resolve for the browser).
export const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,image/gif,image/tiff,image/bmp";
export const ACCEPTED_IMAGE_EXTENSIONS =
  ".jpg,.jpeg,.png,.webp,.heic,.heif,.avif,.gif,.tiff,.bmp";
export const IMAGE_UPLOAD_HINT =
  "JPEG, PNG, WebP, HEIC, AVIF · Auto-optimized to WebP before upload";
const MAX_EDGE = 2000;
const QUALITY = 0.82;


function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image file."));
    img.src = url;
  });
}

// Returns the compressed WebP file, or the original when the type is unsupported.
// Downscales large photos to max 2000px and encodes to lightweight WebP,
// dropping typical phone photos from 10MB+ down to ~200-350KB before upload.
export async function compressImageFile(file: File): Promise<File> {
  const isImage =
    file.type.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|heic|heif|avif|gif|tiff|bmp)$/i.test(file.name);
  if (!isImage || file.type === "image/svg+xml" || /\.svg$/i.test(file.name)) {
    return file;
  }

  let sourceFile = file;
  const isHeic =
    /\.(heic|heif)$/i.test(file.name) ||
    file.type === "image/heic" ||
    file.type === "image/heif";

  if (isHeic && typeof window !== "undefined") {
    try {
      type HeicConverter = (options: {
        blob: Blob;
        toType?: string;
        quality?: number;
      }) => Promise<Blob | Blob[]>;
      const raw = (await import("heic2any")) as unknown;
      const mod = raw as { default?: HeicConverter | { default?: HeicConverter } };
      const heic2any =
        typeof mod.default === "function"
          ? mod.default
          : typeof raw === "function"
          ? (raw as HeicConverter)
          : typeof mod.default?.default === "function"
          ? mod.default.default
          : null;

      if (!heic2any) {
        throw new Error("HEIC image decoder could not be initialized.");
      }

      // Convert HEIC to JPEG. Use quality 0.75 for fast decoding & memory efficiency
      // (the downscale canvas below will produce the crisp final WebP).
      const conversionPromise = heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: 0.75,
      });

      // Safety timeout: 25 seconds max so conversion never hangs indefinitely
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("iPhone photo processing timed out.")),
          25000
        )
      );

      const result = await Promise.race([conversionPromise, timeoutPromise]);
      const convertedBlob = Array.isArray(result) ? result[0] : result;
      if (!convertedBlob) {
        throw new Error("Conversion produced an empty file.");
      }

      sourceFile = new File(
        [convertedBlob],
        file.name.replace(/\.(heic|heif)$/i, ".jpg"),
        { type: "image/jpeg" }
      );
    } catch (err) {
      console.warn("[compressImageFile] heic2any conversion failed:", err);
      // NEVER return unconverted HEIC — neither HTML5 canvas nor the database supports it
      throw new Error(
        `Could not convert iPhone photo "${file.name}". Please export as JPG/PNG or try uploading again.`
      );
    }
  }

  const url = URL.createObjectURL(sourceFile);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return sourceFile;
    ctx.drawImage(img, 0, 0, w, h);

    // Try WebP first for optimal compression ratio
    let blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY)
    );
    let isWebp = blob?.type === "image/webp";

    // Fallback to JPEG if browser canvas doesn't support WebP export
    if (!blob || !isWebp) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", QUALITY)
      );
      isWebp = false;
    }

    if (!blob) return sourceFile;
    const ext = isWebp ? ".webp" : ".jpg";
    const mime = isWebp ? "image/webp" : "image/jpeg";
    const name = sourceFile.name.replace(/\.[^.]+$/, "") + ext;
    return new File([blob], name, { type: mime });
  } catch {
    // If the browser cannot render this image in a canvas, return converted sourceFile or original
    return sourceFile;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function dataUrlToFile(dataUrl: string, filename = "image.jpg"): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const binary = atob(base64);
  const u8arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    u8arr[i] = binary.charCodeAt(i);
  }
  return new File([u8arr], filename, { type: mime });
}

// Actions that throw before returning (expired session via proxy redirect,
// dropped connection, over-limit body) surface as an opaque "unexpected
// response" — map it to something the user can act on.
export function friendlyUploadError(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  if (/unexpected response was received from the server/i.test(message)) {
    return "Upload was blocked before it reached the server — check your connection and sign-in, then try again. If it keeps happening, a firewall rule may be blocking uploads.";
  }
  return message || fallback;
}
