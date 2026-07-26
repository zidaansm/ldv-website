import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { path } = body;

    if (!path) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Use admin client to insert safely from server side
    const { error } = await supabaseAdmin
      .from("page_views")
      .insert({ path });

    if (error) {
      console.error("Error inserting page view:", error);
      return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/track:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
