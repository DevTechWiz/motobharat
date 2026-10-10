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
