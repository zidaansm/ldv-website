import { createClient } from "@supabase/supabase-js";
import { MembersClient } from "./members-client";

// ISR: Cache this page for 60 seconds
export const revalidate = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ITEMS_PER_PAGE = 12;

export default async function MembersPage() {
  // Fetch first page and total count for ISR
  const { count } = await supabase.from("members").select("*", { count: "exact", head: true });
  const { data } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false })
    .range(0, ITEMS_PER_PAGE - 1);

  return (
    <MembersClient 
      initialMembers={data || []} 
      initialTotalCount={count || 0} 
    />
  );
}
