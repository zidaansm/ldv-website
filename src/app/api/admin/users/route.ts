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

  // Fetch all users using admin API
  const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (usersError) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  // Fetch roles
  const { data: rolesData, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select("*");

  if (rolesError) {
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }

  // Combine data
  const combinedUsers = users.map(user => {
    const roleRecord = rolesData.find(r => r.id === user.id);
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      role: roleRecord ? roleRecord.role : "unassigned"
    };
  });

  return NextResponse.json({ users: combinedUsers });
}

export async function POST(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Role hierarchy validation
    if (auth.role === "admin" && role !== "event_organizer") {
      return NextResponse.json({ error: "Admins can only create event organizers" }, { status: 403 });
    }
    if (auth.role === "super_admin" && !["super_admin", "admin", "event_organizer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Create user via Admin API
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        id: userData.user.id,
        role: role
      });

    if (roleError) {
      // Rollback user creation if role assignment fails
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: userData.user });

  } catch (error: any) {
    console.error("Unhandled error in POST /api/admin/users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Prevent self-deletion
    if (userId === auth.userId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Role hierarchy validation for deletion
    if (auth.role === "admin") {
      // Admin can only delete event_organizers
      const { data: targetRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("id", userId)
        .single();
      
      if (targetRole?.role !== "event_organizer") {
         return NextResponse.json({ error: "Admins can only delete event organizers" }, { status: 403 });
      }
    }

    // Delete user (user_roles will be cascade deleted)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { id, email, password, role } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Role hierarchy validation
    if (auth.role === "admin") {
      // Admins cannot change someone to super_admin or admin, they can only make them event_organizer
      if (role && role !== "event_organizer") {
        return NextResponse.json({ error: "Admins can only assign the event_organizer role" }, { status: 403 });
      }
      
      // Admin can only edit event_organizers
      const { data: targetRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("id", id)
        .single();
      
      if (targetRole?.role !== "event_organizer") {
         return NextResponse.json({ error: "Admins can only edit event organizers" }, { status: 403 });
      }
    }
    
    if (auth.role === "super_admin" && role && !["super_admin", "admin", "event_organizer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Update password and email if provided
    const updatePayload: any = {};
    if (password) updatePayload.password = password;
    if (email) {
      updatePayload.email = email;
      updatePayload.email_confirm = true;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, updatePayload);
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }
    }

    // Update role if provided
    if (role) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .update({ role: role })
        .eq("id", id);
      
      if (roleError) {
        return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Unhandled error in PUT /api/admin/users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
