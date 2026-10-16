import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/container";
import { PageMasthead } from "@/components/layout/page-masthead";
import { GalleryClient } from "./gallery-client";
import type { MemoryItem } from "@/components/gallery/memory-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community Gallery · MotoBharat Warangal",
  description:
    "Photos and visual memories captured across community rides, touring expeditions, and breakfast runs in Warangal, Telangana.",
  openGraph: {
    title: "Community Gallery · MotoBharat Warangal",
    description: "Visual memories from community motorcycle rides across Telangana.",
  },
};

export default async function GalleryPage() {
  const supabase = await createClient();

  const { data: galleryRows } = await supabase
    .from("gallery")
    .select("*, event:events(id, title, slug, starts_at, destination)")
    .order("created_at", { ascending: false });

  const photos = (galleryRows ?? []) as unknown as MemoryItem[];

  return (
    <>
      <PageMasthead
        eyebrow="Visual Archive"
        title="Community Gallery"
        meta="Warangal · Telangana"
        lede="Every milestone, mountain pass, and chai stop captured on the road."
      />

      <section className="py-6 sm:py-10">
        <Container>
          <GalleryClient photos={photos} />
        </Container>
      </section>
    </>
  );
}
