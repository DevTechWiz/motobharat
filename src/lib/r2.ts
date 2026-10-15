import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function env() {
  let cfEnv: Record<string, string | undefined> | undefined;
  try {
    const ctx = getCloudflareContext();
    cfEnv = ctx?.env as unknown as Record<string, string | undefined>;
  } catch {
    // not in Cloudflare Worker context (e.g. local dev or test environment)
  }

  const accountId = process.env.R2_ACCOUNT_ID || cfEnv?.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || cfEnv?.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || cfEnv?.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || cfEnv?.R2_BUCKET;
  const rawPublicUrl = process.env.R2_PUBLIC_BASE_URL || cfEnv?.R2_PUBLIC_BASE_URL;
  const publicBaseUrl = rawPublicUrl?.replace(/\/$/, "");

  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
}

export function r2Configured(): boolean {
  const e = env();
  return !!(e.accountId && e.accessKeyId && e.secretAccessKey && e.bucket && e.publicBaseUrl);
}

// Names-only diagnostic: logged on the server, not dumped into UI text.
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
  if (missing.length > 0) {
    console.error(`[R2] Storage not configured. Missing variables: ${missing.join(", ")}`);
  }
  return `${context} right now. Please try again in a moment.`;
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
