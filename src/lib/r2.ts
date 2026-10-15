import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

interface R2BucketBinding {
  put(
    key: string,
    value: Buffer | Uint8Array | ArrayBuffer | ReadableStream | string,
    options?: {
      httpMetadata?: {
        contentType?: string;
        cacheControl?: string;
      };
      customMetadata?: Record<string, string>;
    },
  ): Promise<unknown>;
  delete(key: string | string[]): Promise<void>;
  get(key: string): Promise<unknown>;
}

interface StorageEnv {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  publicBaseUrl: string;
  r2Bucket?: R2BucketBinding;
}

let cachedEnv: StorageEnv | null = null;

export async function getStorageEnv(): Promise<StorageEnv> {
  let cfEnv: Record<string, unknown> | undefined;

  // 1. Try global Cloudflare context symbol
  try {
    const globalCtx = (
      globalThis as unknown as Record<symbol, { env?: Record<string, unknown> }>
    )[Symbol.for("__cloudflare-context__")];
    cfEnv = globalCtx?.env;
  } catch {
    // ignore
  }

  // 2. Try official async getCloudflareContext
  if (!cfEnv) {
    try {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const ctx = await getCloudflareContext({ async: true });
      cfEnv = ctx?.env as unknown as Record<string, unknown> | undefined;
    } catch {
      // not in Cloudflare Worker context (e.g. local dev or test environment)
    }
  }

  // 3. Try sync getCloudflareContext fallback
  if (!cfEnv) {
    try {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      const ctx = getCloudflareContext();
      cfEnv = ctx?.env as unknown as Record<string, unknown> | undefined;
    } catch {
      // ignore
    }
  }

  const accountId =
    process.env.R2_ACCOUNT_ID || (cfEnv?.R2_ACCOUNT_ID as string | undefined);
  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID || (cfEnv?.R2_ACCESS_KEY_ID as string | undefined);
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY || (cfEnv?.R2_SECRET_ACCESS_KEY as string | undefined);
  const bucket =
    process.env.R2_BUCKET ||
    (cfEnv?.R2_BUCKET as string | undefined) ||
    (cfEnv?.R2_BUCKET_NAME as string | undefined) ||
    "motobharat-assets";
  const rawPublicUrl =
    process.env.R2_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    (cfEnv?.R2_PUBLIC_BASE_URL as string | undefined) ||
    (cfEnv?.NEXT_PUBLIC_R2_PUBLIC_URL as string | undefined) ||
    "https://assets.motobharat.co";
  const publicBaseUrl = rawPublicUrl.replace(/\/$/, "");

  // Native bucket binding if configured in wrangler.jsonc (motobharat_assets)
  const r2Bucket = (cfEnv?.motobharat_assets || cfEnv?.bumpone_assets || cfEnv?.assets) as
    | R2BucketBinding
    | undefined;

  cachedEnv = { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl, r2Bucket };
  return cachedEnv;
}

export async function r2Configured(): Promise<boolean> {
  const e = await getStorageEnv();
  const hasNativeBucket = !!(e.r2Bucket && typeof e.r2Bucket.put === "function");
  const hasS3 = !!(e.accountId && e.accessKeyId && e.secretAccessKey && e.bucket);
  return (hasNativeBucket || hasS3) && !!e.publicBaseUrl;
}

// Names-only diagnostic: logged on the server, not dumped into UI text.
export async function missingR2Vars(): Promise<string[]> {
  const e = await getStorageEnv();
  if (e.r2Bucket) return [];
  const missing: string[] = [];
  if (!e.accountId) missing.push("R2_ACCOUNT_ID");
  if (!e.accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!e.secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!e.bucket) missing.push("R2_BUCKET");
  if (!e.publicBaseUrl) missing.push("R2_PUBLIC_BASE_URL");
  return missing;
}

export function r2NotConfiguredError(context: string): string {
  console.error(`[R2] Storage not configured for ${context}. Please ensure R2 variables or bucket binding are present.`);
  return `${context} right now. Please try again in a moment.`;
}

let client: S3Client | null = null;

function getClient(e: StorageEnv): S3Client {
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
  const e = await getStorageEnv();

  // 1. Primary: Native Cloudflare R2 bucket binding via OpenNext
  if (e.r2Bucket && typeof e.r2Bucket.put === "function") {
    await e.r2Bucket.put(key, body, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    return;
  }

  // 2. Secondary: AWS S3 Client compatibility
  if (!e.bucket) throw new Error("R2 is not configured — missing R2_BUCKET");
  await getClient(e).send(
    new PutObjectCommand({
      Bucket: e.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

export async function deleteR2Object(key: string): Promise<void> {
  const e = await getStorageEnv();

  // 1. Primary: Native Cloudflare R2 bucket binding via OpenNext
  if (e.r2Bucket && typeof e.r2Bucket.delete === "function") {
    await e.r2Bucket.delete(key);
    return;
  }

  // 2. Secondary: AWS S3 Client compatibility
  if (!e.bucket) throw new Error("R2 is not configured — missing R2_BUCKET");
  await getClient(e).send(new DeleteObjectCommand({ Bucket: e.bucket, Key: key }));
}

export function r2PublicUrl(key: string): string {
  const base =
    cachedEnv?.publicBaseUrl ||
    process.env.R2_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    "https://assets.motobharat.co";
  return `${base.replace(/\/$/, "")}/${key}`;
}

// Only strips our own public prefix; foreign URLs (e.g. seed demos) return null and are left alone.
export function r2KeyFromUrl(url: string): string | null {
  const base =
    cachedEnv?.publicBaseUrl ||
    process.env.R2_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    "https://assets.motobharat.co";
  const prefix = `${base.replace(/\/$/, "")}/`;
  if (url.startsWith(prefix)) return url.slice(prefix.length);

  if (url.startsWith("https://assets.motobharat.co/")) {
    return url.slice("https://assets.motobharat.co/".length);
  }
  return null;
}
