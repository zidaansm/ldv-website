import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();

    // Initialize Supabase server client (using anon key for session verification)
    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Verify session
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify role
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      roleError ||
      !roleData ||
      (roleData.role !== "admin" && roleData.role !== "super_admin")
    ) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { action, type, id } = body;

    if (!id || !action || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use Supabase Admin Client (Service Role) to bypass RLS

    if (type === "post") {
      if (action === "approve") {
        const { error } = await supabaseAdmin
          .from("menfess")
          .update({ is_approved: true })
          .eq("id", id);
          
        if (error) throw error;
        return NextResponse.json({ success: true, message: "Menfess approved" });
        
      } else if (action === "delete") {
        const { error } = await supabaseAdmin
          .from("menfess")
          .delete()
          .eq("id", id);
          
        if (error) throw error;
        return NextResponse.json({ success: true, message: "Menfess deleted" });
      }
      
    } else if (type === "comment") {
      if (action === "delete") {
        const { error } = await supabaseAdmin
          .from("menfess_comments")
          .delete()
          .eq("id", id);
          
        if (error) throw error;
        return NextResponse.json({ success: true, message: "Comment deleted" });
      }
    }

    return NextResponse.json({ error: "Invalid action or type" }, { status: 400 });

  } catch (error: any) {
    console.error("Admin Menfess API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
