import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

// Any https host — admins can paste external image URLs (06_MEDIA.md § URL-based photos);
// URLs only enter the DB after lib/url-image.ts validation.
const remotePatterns: RemotePattern[] = [{ protocol: "https", hostname: "**" }];

const r2Base = process.env.R2_PUBLIC_BASE_URL;
if (r2Base) {
  const host = new URL(r2Base);
  remotePatterns.push({ protocol: host.protocol.replace(":", "") as "http" | "https", hostname: host.hostname });
}

// docs/07_SECURITY.md § Launch hardening checklist — CSP + headers.
// script-src needs 'unsafe-inline': App Router ships the RSC payload as inline <script> tags.
// static.cloudflareinsights.com / cloudflareinsights.com: Cloudflare Web Analytics
// beacon (auto-injected RUM) — analytics-only, allowlisted so it loads and reports.
const isDev = process.env.NODE_ENV === "development";
const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com"
  : "'self' 'unsafe-inline' https://static.cloudflareinsights.com";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://cloudflareinsights.com",
      "frame-src https://accounts.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      // Apex + www both serve the site — unlisted origins get 403 on action POSTs.
      allowedOrigins: ["motobharat.co", "www.motobharat.co"],
    },
  },
  images: {
    unoptimized: true,
    remotePatterns,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/(favicon.*|apple-touch-icon.*|brand/.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

// Lets `next dev` resolve Cloudflare bindings locally (no-op in production builds).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
