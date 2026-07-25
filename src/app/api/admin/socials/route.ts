import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to verify admin access
async function verifyAdminAccess() {
  const supabase = await createServerClient();
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

  const { data: socials, error } = await supabaseAdmin
    .from("social_links")
    .select("*")
    .order("order_index", { ascending: true });
  
  if (error) {
    return NextResponse.json({ error: "Failed to fetch social links" }, { status: 500 });
  }

  return NextResponse.json(socials);
}

export async function POST(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const json = await request.json();
    const { platform, url, username, icon_name, order_index, is_active } = json;

    if (!platform || !url) {
      return NextResponse.json({ error: "Platform and URL are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("social_links")
      .insert([
        {
          platform,
          url,
          username: username || null,
          icon_name: icon_name || 'globe',
          order_index: order_index || 0,
          is_active: is_active !== undefined ? is_active : true
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create social link" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const json = await request.json();
    const { id, platform, url, username, icon_name, order_index, is_active } = json;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (platform !== undefined) updateData.platform = platform;
    if (url !== undefined) updateData.url = url;
    if (username !== undefined) updateData.username = username || null;
    if (icon_name !== undefined) updateData.icon_name = icon_name;
    if (order_index !== undefined) updateData.order_index = order_index;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from("social_links")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update social link" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("social_links")
      .delete()
      .eq("id", id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete social link" }, { status: 500 });
  }
}
