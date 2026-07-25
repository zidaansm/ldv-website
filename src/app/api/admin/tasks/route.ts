import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

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
    return { authorized: false, error: "Unauthorized role", status: 403 };
  }
  
  return { authorized: true, role: roleData.role, userId: session.user.id };
}

export async function GET(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    // Fetch all tasks
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from("admin_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 400 });
    }

    // Fetch all users to map emails
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    let tasksWithEmails = tasks;
    
    let allUsers: {id: string, email: string}[] = [];
    
    if (!usersError && usersData?.users) {
      const userMap = new Map();
      usersData.users.forEach(u => {
        if (u.email) {
          userMap.set(u.id, u.email);
          allUsers.push({ id: u.id, email: u.email });
        }
      });
      
      tasksWithEmails = tasks.map(task => ({
        ...task,
        assignee_email: task.assignee_id ? userMap.get(task.assignee_id) : null,
        creator_email: task.creator_id ? userMap.get(task.creator_id) : null,
      }));
    }

    return NextResponse.json({ success: true, tasks: tasksWithEmails, users: allUsers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { title, description, assignee_id, status } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("admin_tasks")
      .insert({
        title,
        description: description || null,
        assignee_id: assignee_id || null,
        status: status || 'todo',
        creator_id: auth.userId
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, task: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { id, title, description, status, assignee_id } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Only update provided fields
    const updates: any = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (assignee_id !== undefined) updates.assignee_id = assignee_id;

    const { data, error } = await supabaseAdmin
      .from("admin_tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, task: data });
  } catch (error: any) {
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
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("admin_tasks")
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
