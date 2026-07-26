import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // 1. Authenticate and verify role (Admin / Super Admin only)
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!roleData || (roleData.role !== "admin" && roleData.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine date range
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (startDateParam && !isNaN(Date.parse(startDateParam))) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
    }
    
    if (endDateParam && !isNaN(Date.parse(endDateParam))) {
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();

    // 2. Fetch Data concurrently
    
    // Total Collaborations
    const { count: collaborationsCount } = await supabaseAdmin
      .from("collaborations")
      .select("*", { count: "exact", head: true });

    // Total Admins/Staff
    const { count: staffCount } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true });

    // Tasks (Completed vs Pending)
    const { data: tasks } = await supabaseAdmin
      .from("tasks")
      .select("status");
    
    let completedTasks = 0;
    let pendingTasks = 0;
    if (tasks) {
      tasks.forEach(t => {
        if (t.status === "completed") completedTasks++;
        else pendingTasks++;
      });
    }

    // Page Views over selected range
    const { data: pageViews } = await supabaseAdmin
      .from("page_views")
      .select("created_at")
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr);

    // Menfess over selected range
    const { data: menfess } = await supabaseAdmin
      .from("menfess")
      .select("created_at")
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr);

    // Admin Logs over selected range
    const { data: adminLogs } = await supabaseAdmin
      .from("admin_logs")
      .select("admin_email, action")
      .gte("created_at", startDateStr)
      .lte("created_at", endDateStr);

    // 3. Process time-series data (Group by Day)
    const viewTrend: Record<string, number> = {};
    const menfessTrend: Record<string, number> = {};
    
    // Initialize dates in range with 0
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      viewTrend[dateStr] = 0;
      menfessTrend[dateStr] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (pageViews) {
      pageViews.forEach(v => {
        const dateStr = v.created_at.split('T')[0];
        if (viewTrend[dateStr] !== undefined) viewTrend[dateStr]++;
      });
    }

    if (menfess) {
      menfess.forEach(m => {
        const dateStr = m.created_at.split('T')[0];
        if (menfessTrend[dateStr] !== undefined) menfessTrend[dateStr]++;
      });
    }

    // Convert object to array for chart
    const trendData = Object.keys(viewTrend).map(date => ({
      date,
      views: viewTrend[date],
      menfess: menfessTrend[date]
    }));

    // Process Admin Productivity
    const adminProductivity: Record<string, number> = {};
    if (adminLogs) {
      adminLogs.forEach(log => {
        const email = log.admin_email || "Unknown";
        adminProductivity[email] = (adminProductivity[email] || 0) + 1;
      });
    }

    const productivityData = Object.keys(adminProductivity)
      .map(email => ({
        email,
        actions: adminProductivity[email]
      }))
      .sort((a, b) => b.actions - a.actions) // Sort by most active
      .slice(0, 5); // Top 5 admins

    // Combine response
    return NextResponse.json({
      scorecards: {
        totalViews: pageViews?.length || 0,
        totalMenfess: menfess?.length || 0,
        totalCollaborations: collaborationsCount || 0,
        totalStaff: staffCount || 0,
        completedTasks,
        pendingTasks,
        totalActions: adminLogs?.length || 0,
      },
      trendData,
      productivityData,
      taskData: [
        { name: "Completed", value: completedTasks },
        { name: "Pending / In Progress", value: pendingTasks }
      ],
      period: {
        startDate: startDateStr,
        endDate: endDateStr
      }
    });

  } catch (error: any) {
    console.error("Report API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!roleData || (roleData.role !== "admin" && roleData.role !== "super_admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { months } = body; // e.g. 6 or 12

    if (!months || isNaN(Number(months))) {
      return NextResponse.json({ error: "Invalid months provided" }, { status: 400 });
    }

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - Number(months));
    const cutoffDateStr = cutoffDate.toISOString();

    const { error } = await supabaseAdmin
      .from("page_views")
      .delete()
      .lt("created_at", cutoffDateStr);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: `Deleted records older than ${months} months` });
  } catch (error: any) {
    console.error("Error clearing analytics:", error);
    return NextResponse.json({ error: "Failed to clear old analytics data" }, { status: 500 });
  }
}
