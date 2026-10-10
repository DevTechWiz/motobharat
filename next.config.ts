import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";

const remotePatterns: RemotePattern[] = [
  { protocol: "https", hostname: "*.r2.dev" },
  { protocol: "https", hostname: "images.unsplash.com" },
];

const r2Base = process.env.R2_PUBLIC_BASE_URL;
if (r2Base) {
  const host = new URL(r2Base);
  remotePatterns.push({ protocol: host.protocol.replace(":", "") as "http" | "https", hostname: host.hostname });
}

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
};

export default nextConfig;
