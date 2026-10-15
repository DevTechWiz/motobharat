import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function env() {
  let accountId = process.env.R2_ACCOUNT_ID;
  let accessKeyId = process.env.R2_ACCESS_KEY_ID;
  let secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  let bucket = process.env.R2_BUCKET;
  let publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
    try {
      const globalContext = (
        globalThis as unknown as Record<symbol, { env?: Record<string, string> }>
      )[Symbol.for("__cloudflare-context__")];
      const cfEnv = globalContext?.env;
      if (cfEnv) {
        accountId = accountId || cfEnv.R2_ACCOUNT_ID;
        accessKeyId = accessKeyId || cfEnv.R2_ACCESS_KEY_ID;
        secretAccessKey = secretAccessKey || cfEnv.R2_SECRET_ACCESS_KEY;
        bucket = bucket || cfEnv.R2_BUCKET;
        publicBaseUrl = publicBaseUrl || cfEnv.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
      }
    } catch {
      // ignore
    }

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicBaseUrl) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getCloudflareContext } = require("@opennextjs/cloudflare");
        const ctx = getCloudflareContext();
        if (ctx?.env) {
          accountId = accountId || ctx.env.R2_ACCOUNT_ID;
          accessKeyId = accessKeyId || ctx.env.R2_ACCESS_KEY_ID;
          secretAccessKey = secretAccessKey || ctx.env.R2_SECRET_ACCESS_KEY;
          bucket = bucket || ctx.env.R2_BUCKET;
          publicBaseUrl = publicBaseUrl || ctx.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
        }
      } catch {
        // ignore
      }
    }
  }

  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl };
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
