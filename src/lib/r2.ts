import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function env() {
  return {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, ""),
  };
}

export function r2Configured(): boolean {
  const e = env();
  return !!(e.accountId && e.accessKeyId && e.secretAccessKey && e.bucket && e.publicBaseUrl);
}

// Names-only diagnostic: safe to surface to admins (never values). Lets a
// production "not configured" error say exactly which var is missing instead
// of sending anyone back to re-check all five.
export function missingR2Vars(): string[] {
  const e = env();
  const missing: string[] = [];
  if (!e.accountId) missing.push("R2_ACCOUNT_ID");
  if (!e.accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!e.secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!e.bucket) missing.push("R2_BUCKET");
  if (!e.publicBaseUrl) missing.push("R2_PUBLIC_BASE_URL");
  return missing;
}

export function r2NotConfiguredError(context: string): string {
  const missing = missingR2Vars();
  const detail = missing.length > 0 ? ` Setup detail — missing: ${missing.join(",")}.` : "";
  return `${context} right now.${detail} Set them on the Worker under Settings → Variables and Secrets, not just .env.local.`;
}

let client: S3Client | null = null;

function getClient(): S3Client {
  const e = env();
  if (!e.accountId || !e.accessKeyId || !e.secretAccessKey) {
    throw new Error("R2 is not configured — missing R2_* env vars");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${e.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: e.accessKeyId, secretAccessKey: e.secretAccessKey },
    });
  }
  return client;
}

export async function putR2Object(key: string, body: Buffer, contentType: string): Promise<void> {
  const e = env();
  if (!e.bucket) throw new Error("R2 is not configured — missing R2_BUCKET");
  await getClient().send(
    new PutObjectCommand({ Bucket: e.bucket, Key: key, Body: body, ContentType: contentType }),
  );
}

export async function deleteR2Object(key: string): Promise<void> {
  const e = env();
  if (!e.bucket) throw new Error("R2 is not configured — missing R2_BUCKET");
  await getClient().send(new DeleteObjectCommand({ Bucket: e.bucket, Key: key }));
}

export function r2PublicUrl(key: string): string {
  const base = env().publicBaseUrl;
  if (!base) throw new Error("R2 is not configured — missing R2_PUBLIC_BASE_URL");
  return `${base}/${key}`;
}

// Only strips our own public prefix; foreign URLs (e.g. seed demos) return null and are left alone.
export function r2KeyFromUrl(url: string): string | null {
  const base = env().publicBaseUrl;
  if (!base) return null;
  const prefix = `${base}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}
