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

  const { data: collaborations, error } = await supabaseAdmin
    .from("collaborations")
    .select("*")
    .order("order_index", { ascending: true });
  
  if (error) {
    return NextResponse.json({ error: "Failed to fetch collaborations" }, { status: 500 });
  }

  return NextResponse.json({ collaborations });
}

export async function POST(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { title, icon, description, order_index } = body;

    if (!title || !icon) {
      return NextResponse.json({ error: "Missing required fields: title and icon" }, { status: 400 });
    }

    const { data: collaboration, error: createError } = await supabaseAdmin
      .from("collaborations")
      .insert({
        title,
        icon,
        description,
        order_index: order_index || 0
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating collaboration:", createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, collaboration });

  } catch (error: any) {
    console.error("Unhandled error in POST /api/admin/collaborations:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { id, title, icon, description, order_index } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing collaboration ID" }, { status: 400 });
    }

    const updatePayload: any = {};
    if (title !== undefined) updatePayload.title = title;
    if (icon !== undefined) updatePayload.icon = icon;
    if (description !== undefined) updatePayload.description = description;
    if (order_index !== undefined) updatePayload.order_index = order_index;

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("collaborations")
        .update(updatePayload)
        .eq("id", id);
      
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Unhandled error in PUT /api/admin/collaborations:", error);
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
      return NextResponse.json({ error: "Missing collaboration ID" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("collaborations")
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
