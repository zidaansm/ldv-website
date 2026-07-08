import { createClient } from "@/lib/supabase/client";

export async function logAdminAction(action: string, details: string) {
  try {
    const supabase = createClient();
    
    // Fetch the current user to get their email
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    let adminEmail = "Unknown Admin";
    if (!userError && user?.email) {
      adminEmail = user.email;
    }

    // Insert the log into the admin_logs table
    await supabase.from("admin_logs").insert({
      action,
      details,
      admin_email: adminEmail,
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
    // We swallow the error so it doesn't break the main flow if logging fails
  }
}
