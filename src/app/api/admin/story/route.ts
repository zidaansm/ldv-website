import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: story, error } = await supabaseAdmin
    .from("story_sections")
    .select("*")
    .order("order_index", { ascending: true });
  
  if (error) {
    return NextResponse.json({ error: "Failed to fetch story sections" }, { status: 500 });
  }

  return NextResponse.json(story);
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { title, content, order_index, is_active } = json;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("story_sections")
      .insert([
        {
          title,
          content,
          order_index: order_index || 0,
          is_active: is_active !== undefined ? is_active : true
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create story section" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const json = await request.json();
    const { id, title, content, order_index, is_active } = json;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (order_index !== undefined) updateData.order_index = order_index;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from("story_sections")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update story section" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("story_sections")
      .delete()
      .eq("id", id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete story section" }, { status: 500 });
  }
}
