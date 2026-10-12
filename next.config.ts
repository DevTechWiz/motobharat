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
// connect-src allows the browser Supabase client; frame-src covers the Google OAuth flow.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data:",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in",
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
  images: { remotePatterns },
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
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
