import { createClient } from "@supabase/supabase-js";
import { StoryClient } from "./story-client";

// ISR: Cache this page for 60 seconds
export const revalidate = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function StoryPage() {
  const { data } = await supabase
    .from("story_sections")
    .select("*")
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  return <StoryClient initialSections={data || []} />;
}
