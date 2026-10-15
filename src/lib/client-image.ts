// Browser-side image prep, shared by every file-upload surface (gallery, DL
// picker, avatar; covers arrive pre-framed from the cropper). Downscale +
// JPEG re-encode before upload so R2 objects stay small even where sharp
// can't run (the Workers fallback stores input bytes), EXIF/GPS never leaves
// the device, and users never hit the 10 MB server cap.
const MAX_EDGE = 2000;
const QUALITY = 0.85;
const COMPRESSIBLE = ["image/jpeg", "image/png", "image/webp"];

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image file."));
    img.src = url;
  });
}

// Returns the compressed file, or the original when the type is unsupported
// (the server then reports the specific cause). Throws when the file can't
// be decoded — callers fall back to the original for the same reason.
export async function compressImageFile(file: File): Promise<File> {
  if (!COMPRESSIBLE.includes(file.type)) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Actions that throw before returning (expired session via proxy redirect,
// dropped connection, over-limit body) surface as an opaque "unexpected
// response" — map it to something the user can act on.
export function friendlyUploadError(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : String(err ?? "");
  if (/unexpected response was received from the server/i.test(message)) {
    return "Upload didn't reach the server — check your connection and sign-in, then try again.";
  }
  return message || fallback;
}
