import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

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
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("admin_chat_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (messagesError) {
      return NextResponse.json({ error: messagesError.message }, { status: 400 });
    }

    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    let messagesWithEmails = messages;
    
    if (!usersError && usersData?.users) {
      const userMap = new Map();
      const roleMap = new Map();
      const nameMap = new Map();
      const avatarMap = new Map();
      
      // Let's also fetch user roles to display in chat
      const { data: rolesData } = await supabaseAdmin.from("user_roles").select("*");
      if (rolesData) {
        rolesData.forEach(r => roleMap.set(r.id, r.role));
      }

      usersData.users.forEach(u => {
        if (u.email) {
          userMap.set(u.id, u.email);
        }
        if (u.user_metadata) {
          nameMap.set(u.id, u.user_metadata.full_name);
          avatarMap.set(u.id, u.user_metadata.avatar_url);
        }
      });
      
      messagesWithEmails = messages.map(msg => ({
        ...msg,
        user_email: msg.user_id ? userMap.get(msg.user_id) : "Unknown User",
        user_name: msg.user_id ? nameMap.get(msg.user_id) : undefined,
        user_avatar: msg.user_id ? avatarMap.get(msg.user_id) : undefined,
        user_role: msg.user_id ? roleMap.get(msg.user_id) : "unknown",
      }));
    }

    // Return in ascending order for chat UI
    return NextResponse.json({ success: true, messages: messagesWithEmails.reverse() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("admin_chat_messages")
      .insert({
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
    
    const messageData = {
      ...data,
      user_email: auth.email,
      user_name: user?.user_metadata?.full_name,
      user_avatar: user?.user_metadata?.avatar_url,
      user_role: auth.role
    };

    return NextResponse.json({ success: true, message: messageData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
