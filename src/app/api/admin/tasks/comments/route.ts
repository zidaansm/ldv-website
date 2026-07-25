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
  
  return { authorized: true, role: roleData.role, userId: session.user.id, email: session.user.email };
}

export async function GET(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const { data: comments, error: commentsError } = await supabaseAdmin
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (commentsError) {
      return NextResponse.json({ error: commentsError.message }, { status: 400 });
    }

    // Fetch all users to map emails
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    let commentsWithEmails = comments;
    
    if (!usersError && usersData?.users) {
      const userMap = new Map();
      const nameMap = new Map();
      const avatarMap = new Map();

      usersData.users.forEach(u => {
        if (u.email) {
          userMap.set(u.id, u.email);
        }
        if (u.user_metadata) {
          nameMap.set(u.id, u.user_metadata.full_name);
          avatarMap.set(u.id, u.user_metadata.avatar_url);
        }
      });
      
      commentsWithEmails = comments.map(c => ({
        ...c,
        user_email: c.user_id ? userMap.get(c.user_id) : "Unknown User",
        user_name: c.user_id ? nameMap.get(c.user_id) : undefined,
        user_avatar: c.user_id ? avatarMap.get(c.user_id) : undefined,
      }));
    }

    return NextResponse.json({ success: true, comments: commentsWithEmails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { task_id, content } = body;

    if (!task_id || !content) {
      return NextResponse.json({ error: "Task ID and content are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("task_comments")
      .insert({
        task_id,
        user_id: auth.userId,
        content
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    const userRes = await supabaseAdmin.auth.admin.getUserById(auth.userId);
    const user = userRes.data?.user;

    const commentData = {
      ...data,
      user_email: auth.email,
      user_name: user?.user_metadata?.full_name,
      user_avatar: user?.user_metadata?.avatar_url
    };

    return NextResponse.json({ success: true, comment: commentData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
