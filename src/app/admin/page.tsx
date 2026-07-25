"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Users, Calendar, MessageSquare, ShieldAlert, Image as ImageIcon, Activity, PlusCircle, ArrowRight, Eye, RefreshCw, Key, X } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import toast from "react-hot-toast";
import { CheckSquare, Clock } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [onlineVisitors, setOnlineVisitors] = useState(0);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [myTasks, setMyTasks] = useState<any[]>([]);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  const safeFormatDate = (dateStr: string) => {
    try {
      if (!dateStr) return "Unknown";
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch (e) {
      return "Unknown";
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch exact counts concurrently
      const tables = ["events", "staff", "members", "faq", "banlist", "menfess", "gallery", "twitter_bases", "collaborations", "story_sections", "social_links"];
      const countPromises = tables.map(table => 
        supabase.from(table).select("*", { count: "exact", head: true })
      );
      
      const countResults = await Promise.all(countPromises);
      const newCounts: Record<string, number> = {};
      tables.forEach((table, idx) => {
        newCounts[table] = countResults[idx]?.count || 0;
      });
      setCounts(newCounts);

      // Fetch user role and email
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserEmail(session.user.email || "");
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('id', session.user.id).single();
        if (roleData) {
          setCurrentUserRole(roleData.role);
        }

        // Fetch user tasks
        try {
          const res = await fetch("/api/admin/tasks");
          if (res.ok) {
            const taskData = await res.json();
            const pending = (taskData.tasks || []).filter((t: any) => t.assignee_id === session.user.id && t.status !== 'done');
            setMyTasks(pending.slice(0, 5));
          }
        } catch (e) {
          console.error("Failed to fetch tasks for dashboard");
        }
      }

      // Fetch admin logs
      const { data: logs } = await supabase.from("admin_logs").select("*").order("created_at", { ascending: false }).limit(50);
      if (logs) setAdminLogs(logs);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to presence for live visitors count
    const channel = supabase.channel("public:visitors");
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      let total = 0;
      for (const id in state) {
        total += state[id]?.length || 0;
      }
      setOnlineVisitors(total);
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error("Please enter your old password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    
    setIsUpdatingPassword(true);
    const loadingToast = toast.loading("Verifying old password...");
    
    // Verify old password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUserEmail,
      password: oldPassword
    });

    if (signInError) {
      toast.error("Old password is incorrect", { id: loadingToast });
      setIsUpdatingPassword(false);
      return;
    }

    toast.loading("Updating password...", { id: loadingToast });
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    
    if (updateError) {
      toast.error(updateError.message, { id: loadingToast });
    } else {
      toast.success("Password updated successfully!", { id: loadingToast });
      setOldPassword("");
      setNewPassword("");
    }
    setIsUpdatingPassword(false);
  };

  let adminModules: any[] = [];
  const allModules = [
    { name: "Events", icon: Calendar, path: "/admin/events", color: "primary", count: counts["events"] || 0 },
    { name: "Gallery", icon: ImageIcon, path: "/admin/gallery", color: "pink", count: counts["gallery"] || 0 },
    { name: "Team", icon: Users, path: "/admin/team", color: "secondary", count: counts["staff"] || 0 },
    { name: "Members", icon: Users, path: "/admin/members", color: "primary", count: counts["members"] || 0 },
    { name: "FAQ", icon: MessageSquare, path: "/admin/faq", color: "accent", count: counts["faq"] || 0 },
    { name: "Ban List", icon: ShieldAlert, path: "/admin/banlist", color: "danger", count: counts["banlist"] || 0 },
    { name: "Menfess", icon: MessageSquare, path: "/admin/menfess", color: "purple", count: counts["menfess"] || 0 },
    { name: "Twitter Bases", icon: MessageSquare, path: "/admin/bases", color: "accent", count: counts["twitter_bases"] || 0 },
    { name: "Collaborations", icon: MessageSquare, path: "/admin/collaborations", color: "primary", count: counts["collaborations"] || 0 },
    { name: "Story", icon: MessageSquare, path: "/admin/story", color: "pink", count: counts["story_sections"] || 0 },
    { name: "Socials", icon: MessageSquare, path: "/admin/socials", color: "cyan", count: counts["social_links"] || 0 },
  ];

  if (currentUserRole === "super_admin" || currentUserRole === "admin") {
    adminModules = [...allModules, {
      name: "Accounts", icon: ShieldAlert, path: "/admin/users", color: "warning", count: 0 
    }];
  } else if (currentUserRole === "event_organizer") {
    adminModules = allModules.filter(m => m.name === "Events");
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-border/50 shadow-sm rounded-2xl p-6 bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                LDV Command Center
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full shadow-sm ${
                  currentUserRole === 'super_admin' ? 'bg-danger text-danger-foreground' : 
                  currentUserRole === 'event_organizer' ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground'
                }`}>
                  {currentUserRole.replace('_', ' ').toUpperCase()}
                </span>
                <p className="text-sm font-medium text-muted-foreground">Manage your community content and view real-time stats.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 shadow-sm font-semibold text-sm bg-background hover:bg-muted transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 shadow-sm font-semibold text-sm bg-background hover:bg-muted transition-all hidden sm:flex"
            >
              <Users className="w-4 h-4" />
              My Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-danger/20 shadow-sm font-semibold text-sm bg-danger/5 text-danger hover:bg-danger hover:text-danger-foreground transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content Area (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="border border-border/50 shadow-sm rounded-2xl p-5 bg-card flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <Users className="w-6 h-6 text-primary mb-2" />
                <div>
                  <div className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    {isLoading ? "-" : counts["members"] || 0}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Total Members</div>
                </div>
              </div>
              <div className="border border-border/50 shadow-sm rounded-2xl p-5 bg-card flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <Calendar className="w-6 h-6 text-secondary mb-2" />
                <div>
                  <div className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    {isLoading ? "-" : counts["events"] || 0}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Total Events</div>
                </div>
              </div>
              <div className="border border-border/50 shadow-sm rounded-2xl p-5 bg-card flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <MessageSquare className="w-6 h-6 text-purple mb-2" />
                <div>
                  <div className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    {isLoading ? "-" : counts["menfess"] || 0}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Total Menfess</div>
                </div>
              </div>
              <div className="border border-border/50 shadow-sm rounded-2xl p-5 bg-card flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-danger/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <ShieldAlert className="w-6 h-6 text-danger mb-2" />
                <div>
                  <div className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    {isLoading ? "-" : counts["banlist"] || 0}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Banned Users</div>
                </div>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-primary" />
                Management Modules
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {isLoading ? (
                  Array(adminModules.length > 0 ? adminModules.length : 3).fill(0).map((_, i) => (
                    <div key={i} className="border border-border/50 shadow-sm rounded-2xl p-5 bg-card aspect-[4/3] animate-pulse flex flex-col justify-between">
                      <div className="w-12 h-12 bg-muted rounded-xl"></div>
                      <div>
                        <div className="h-5 bg-muted rounded w-2/3 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/3"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  adminModules.map((mod) => (
                    <Link
                      key={mod.name}
                      href={mod.path}
                      className="border border-border/50 shadow-sm rounded-2xl p-5 bg-card flex flex-col justify-between aspect-[4/3] group hover:shadow-md hover:-translate-y-1 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                          style={{
                            backgroundColor: `var(--${mod.color === "danger" ? "danger" : mod.color})`,
                            color: mod.color === "accent" ? "var(--accent-foreground)" : "var(--primary-foreground)"
                          }}
                        >
                          <mod.icon className="w-6 h-6" />
                        </div>
                        <div className="bg-background border border-border/50 rounded-full px-3 py-1 text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                          {isLoading ? "..." : mod.count} Items
                        </div>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                          {mod.name}
                        </h2>
                        <div className="text-muted-foreground font-medium text-xs mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                          Manage <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border border-border/50 shadow-sm rounded-2xl p-6 bg-card/50 backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="flex flex-wrap gap-3">
                <Link href="/admin/events?action=new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 rounded-xl font-semibold text-sm transition-all">
                  <PlusCircle className="w-4 h-4" /> New Event
                </Link>
                {(currentUserRole === 'super_admin' || currentUserRole === 'admin') && (
                  <Link href="/admin/members?action=new" className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground shadow-md shadow-secondary/20 hover:-translate-y-0.5 rounded-xl font-semibold text-sm transition-all">
                    <PlusCircle className="w-4 h-4" /> Add Member
                  </Link>
                )}
                <a href="/" target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-background hover:bg-muted border border-border/50 shadow-sm rounded-xl font-semibold text-sm transition-all">
                  <Eye className="w-4 h-4" /> View Live Site
                </a>
              </div>
            </div>

          </div>

          {/* Sidebar Column (Right 1 Column) */}
          <div className="space-y-8">
            
            {/* Live Visitors Card */}
            <div className="border border-border/50 shadow-sm rounded-2xl p-6 bg-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold">Live Visitors</h2>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                  </span>
                </div>
                <div className="text-5xl font-extrabold text-success" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  {onlineVisitors}
                </div>
                <p className="text-sm font-medium text-muted-foreground mt-2">
                  People are currently viewing the website right now.
                </p>
              </div>
            </div>

            {/* My Pending Tasks Widget */}
            <div className="border border-border/50 shadow-sm rounded-2xl p-6 bg-card/50 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-warning" />
                  My Pending Tasks
                </h2>
                <Link href="/admin/tasks" className="text-xs font-bold text-primary hover:underline">View All</Link>
              </div>
              
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground animate-pulse">Loading tasks...</div>
                ) : myTasks.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-background p-4 rounded-xl border border-border/50 text-center">
                    🎉 You have no pending tasks!
                  </div>
                ) : (
                  myTasks.map(task => {
                    const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                    return (
                      <div key={task.id} className="p-3 rounded-xl bg-background border border-border/50 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-1">{task.title}</h3>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border whitespace-nowrap ${
                            task.priority === 'high' ? 'bg-danger/20 text-danger border-danger/30' : 
                            task.priority === 'low' ? 'bg-success/20 text-success border-success/30' : 
                            'bg-warning/20 text-warning border-warning/30'
                          }`}>
                            {task.priority || 'medium'}
                          </span>
                        </div>
                        {task.due_date && (
                          <div className={`flex items-center gap-1 mt-2 text-[10px] font-semibold ${isOverdue ? 'text-danger' : 'text-muted-foreground'}`}>
                            <Clock className="w-3 h-3" />
                            {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Admin Activity Logs */}
            <div className="border border-border/50 shadow-sm rounded-2xl p-6 bg-card/50 backdrop-blur-md">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-primary" />
                Admin Activity Logs
              </h2>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                  <div className="text-sm">Loading logs...</div>
                ) : adminLogs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No recent activity.</div>
                ) : (
                  adminLogs.map(log => (
                    <div key={log.id} className="p-3 rounded-xl bg-background border border-border/50 shadow-sm space-y-1">
                      <div className="font-bold text-xs flex justify-between items-center text-primary">
                        <span>{log.action}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {safeFormatDate(log.created_at)}
                        </span>
                      </div>
                      <div className="text-sm font-medium line-clamp-2">{log.details}</div>
                      <div className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {log.admin_email || "Admin"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border/50 shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> My Profile</h2>
              <button type="button" onClick={() => setIsProfileModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-6">
              {/* Profile Info */}
              <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Email Address</label>
                  <div className="font-semibold text-lg">{currentUserEmail}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Current Role</label>
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full border border-border/50 shadow-sm inline-block ${
                    currentUserRole === 'super_admin' ? 'bg-danger text-danger-foreground' : 
                    currentUserRole === 'event_organizer' ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground'
                  }`}>
                    {currentUserRole.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="h-px w-full bg-border/50" />

              {/* Change Password Form */}
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <h3 className="font-bold flex items-center gap-2"><Key className="w-4 h-4" /> Change Password</h3>
                <div>
                  <label className="block text-sm font-bold mb-1">Old Password</label>
                  <input required type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 bg-background transition-colors" placeholder="Enter current password" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">New Password</label>
                  <input required type="password" minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 bg-background transition-colors" placeholder="Min. 6 characters" />
                </div>
                <button 
                  type="submit" 
                  disabled={isUpdatingPassword}
                  className="w-full py-2 bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all rounded-xl disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                >
                  {isUpdatingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
