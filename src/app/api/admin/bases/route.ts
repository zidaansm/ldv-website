import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Helper function to verify admin access
async function verifyAdminAccess() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { authorized: false, error: "Unauthorized", status: 401 };
  }

  const { data: roleData, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (error || !roleData) {
    return { authorized: false, error: "Forbidden: No role assigned", status: 403 };
  }

  const role = roleData.role;
  if (role !== "super_admin" && role !== "admin") {
    return { authorized: false, error: "Forbidden: Insufficient permissions", status: 403 };
  }

  return { authorized: true, role, userId: session.user.id };
}

export async function GET() {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: bases, error } = await supabaseAdmin
    .from("twitter_bases")
    .select("*")
    .order("created_at", { ascending: true });
  
  if (error) {
    return NextResponse.json({ error: "Failed to fetch bases" }, { status: 500 });
  }

  return NextResponse.json({ bases });
}

export async function POST(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { handle, name, description, rules, logo_url, submit_link } = body;

    if (!handle || !name) {
      return NextResponse.json({ error: "Missing required fields: handle and name" }, { status: 400 });
    }

    const { data: base, error: createError } = await supabaseAdmin
      .from("twitter_bases")
      .insert({
        handle,
        name,
        description,
        rules,
        logo_url,
        submit_link
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating base:", createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, base });

  } catch (error: any) {
    console.error("Unhandled error in POST /api/admin/bases:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { id, handle, name, description, rules, logo_url, submit_link } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing base ID" }, { status: 400 });
    }

    const updatePayload: any = {};
    if (handle !== undefined) updatePayload.handle = handle;
    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (rules !== undefined) updatePayload.rules = rules;
    if (logo_url !== undefined) updatePayload.logo_url = logo_url;
    if (submit_link !== undefined) updatePayload.submit_link = submit_link;

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("twitter_bases")
        .update(updatePayload)
        .eq("id", id);
      
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Unhandled error in PUT /api/admin/bases:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Missing base ID" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("twitter_bases")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
