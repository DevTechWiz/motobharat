import { createClient } from "./supabase/server";
import type { Story } from "./types";

export async function getStories(): Promise<Story[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getStories] Supabase error:", error.message);
      return [];
    }

    return (data ?? []) as Story[];
  } catch (err) {
    console.error("[getStories] Failed to fetch stories:", err);
    return [];
  }
}

export async function getStoryBySlug(slug: string): Promise<Story | null> {
  try {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    let query = supabase.from("stories").select("*");
    if (isUuid) {
      query = query.or(`slug.eq.${slug},id.eq.${slug}`);
    } else {
      query = query.eq("slug", slug);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      if (error) console.error("[getStoryBySlug] Query error:", error.message);
      return null;
    }

    return data as Story;
  } catch (err) {
    console.error("[getStoryBySlug] Failed to fetch story:", err);
    return null;
  }
}
