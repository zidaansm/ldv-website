import { createClient } from "@supabase/supabase-js";
import { GalleryClient } from "./gallery-client";

// ISR: Cache this page for 60 seconds
export const revalidate = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function GalleryPage() {
  const { data } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: false });

  return <GalleryClient initialImages={data || []} />;
}
