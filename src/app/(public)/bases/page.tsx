import { createClient } from "@supabase/supabase-js";
import { BasesClient } from "./bases-client";

// ISR: Cache this page for 60 seconds
export const revalidate = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function BasesPage() {
  const { data } = await supabase
    .from("twitter_bases")
    .select("*")
    .order("created_at", { ascending: true });

  return <BasesClient initialBases={data || []} />;
}
