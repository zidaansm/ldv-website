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
  return { authorized: true, role, userId: session.user.id };
}

export async function GET() {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await supabaseAdmin
    .from("role_permissions")
    .select("*");

  if (error) {
    return NextResponse.json({ error: "Failed to fetch role permissions" }, { status: 500 });
  }

  return NextResponse.json({ permissions: data });
}

export async function PUT(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });
  
  if (auth.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Only super admin can manage role permissions" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { role, allowed_modules } = body;

    if (!role || !Array.isArray(allowed_modules)) {
      return NextResponse.json({ error: "Missing required fields or invalid format" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("role_permissions")
      .upsert({
        role: role,
        allowed_modules: allowed_modules
      });

    if (error) {
      return NextResponse.json({ error: "Failed to update role permissions" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unhandled error in PUT /api/admin/role-permissions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
