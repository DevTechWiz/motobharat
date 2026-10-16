import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://motobharat.co";
  const supabase = await createClient();

  const [{ data: rides }, { data: announcements }] = await Promise.all([
    supabase.from("events").select("slug").eq("status", "published"),
    supabase.from("announcements").select("slug"),
  ]);

  const statics: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/rides`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/gallery`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/announcements`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/safety`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const ridePages: MetadataRoute.Sitemap = (rides ?? [])
    .filter((r) => r.slug)
    .map((r) => ({ url: `${base}/rides/${r.slug}`, changeFrequency: "weekly", priority: 0.8 }));

  const announcementPages: MetadataRoute.Sitemap = (announcements ?? [])
    .filter((a) => a.slug)
    .map((a) => ({ url: `${base}/announcements/${a.slug}`, changeFrequency: "monthly", priority: 0.4 }));

  return [...statics, ...ridePages, ...announcementPages];
}
