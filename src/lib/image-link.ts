// Pure share-link normalizer — no imports, safe for client and server.
// Google Drive viewer links open an HTML page, not image bytes. Extract the
// Drive file ID and rewrite to Google CDN (lh3.googleusercontent.com/d/ID)
// which delivers raw image bytes directly without virus-scan blocks or login walls.

export function extractDriveFileId(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.hostname === "drive.google.com") {
    const fileMatch = /^\/file\/d\/([^/]+)/.exec(url.pathname);
    if (fileMatch) return fileMatch[1];
    if (url.pathname === "/open" || url.pathname === "/uc") {
      return url.searchParams.get("id");
    }
  }
  if (url.hostname === "lh3.googleusercontent.com") {
    const m = /^\/d\/([^/=]+)/.exec(url.pathname);
    if (m) return m[1];
  }
  return null;
}

export function normalizeImageUrl(raw: string): string {
  const id = extractDriveFileId(raw);
  if (id) return `https://lh3.googleusercontent.com/d/${id}`;
  return raw.trim();
}

