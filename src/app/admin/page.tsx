"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Users, Calendar, MessageSquare, ShieldAlert, Image as ImageIcon, Activity, PlusCircle, ArrowRight, Eye, RefreshCw, Key, X, Upload, Camera } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format, subDays } from "date-fns";
import toast from "react-hot-toast";
import { CheckSquare, Clock, Send, TrendingUp, Inbox } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [onlineVisitors, setOnlineVisitors] = useState(0);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [pendingMenfess, setPendingMenfess] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [teamChatPreview, setTeamChatPreview] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [allowedModules, setAllowedModules] = useState<string[]>([]);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

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
        setFullName(session.user.user_metadata?.full_name || "");
        setAvatarUrl(session.user.user_metadata?.avatar_url || "");
        
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('id', session.user.id).single();
        if (roleData) {
          setCurrentUserRole(roleData.role);
          const { data: permData } = await supabase.from('role_permissions').select('allowed_modules').eq('role', roleData.role).single();
          if (permData) {
            setAllowedModules(permData.allowed_modules || []);
          }
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

      // Fetch pending Menfess
      const { data: pendingMenfessData } = await supabase.from("menfess").select("*").eq("is_approved", false).order("created_at", { ascending: false }).limit(5);
      if (pendingMenfessData) setPendingMenfess(pendingMenfessData);

      // Fetch upcoming Events
      const { data: eventsData } = await supabase.from("events").select("*").eq("type", "upcoming").order("date", { ascending: true }).limit(3);
      if (eventsData) setUpcomingEvents(eventsData);

      // Generate Mock Chart Data for Community Engagement
      const mockChartData = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        return {
          name: format(d, 'MMM dd'),
          visitors: Math.floor(Math.random() * 50) + 20,
          members: Math.floor(Math.random() * 10) + 5
        };
      });
      setChartData(mockChartData);

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

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    const loadingToast = toast.loading("Updating profile...");

    try {
      let finalAvatarUrl = avatarUrl;

      if (avatarFile) {
        toast.loading("Uploading avatar to Cloudinary...", { id: loadingToast });
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) throw new Error("Cloudinary credentials missing");

        const formData = new FormData();
        formData.append("file", avatarFile);
        formData.append("upload_preset", uploadPreset);

        const uploadResponse = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploadProgress(Math.round((event.loaded / event.total) * 100));
            }
          };
          xhr.onload = () => {
            if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url);
            else reject(new Error("Upload failed"));
          };
          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });
        finalAvatarUrl = uploadResponse;
        setAvatarUrl(finalAvatarUrl);
      }

      toast.loading("Saving profile...", { id: loadingToast });
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: finalAvatarUrl }
      });

      if (error) throw error;
      toast.success("Profile updated successfully!", { id: loadingToast });
      setAvatarFile(null);
      setUploadProgress(0);
      
      // Update team chat avatars optionally if you wanted to sync, but we rely on next reload or realtime updates usually.
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsUpdatingProfile(false);
      setUploadProgress(0);
    }
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
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-12 h-12 rounded-xl object-cover shadow-lg shadow-primary/20 border border-border/50" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                <LayoutDashboard className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                {fullName ? `Welcome back, ${fullName.split(' ')[0]}!` : "LDV Command Center"}
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
              {(allowedModules.includes("/admin/menfess") || currentUserRole === 'super_admin' || currentUserRole === 'admin') && (
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
              )}
              {(allowedModules.includes("/admin/banlist") || currentUserRole === 'super_admin' || currentUserRole === 'admin') && (
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
              )}
            </div>

            {/* Community Growth Chart */}
            <div className="border border-border/50 shadow-sm rounded-2xl p-6 bg-card/50 backdrop-blur-md space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Community Engagement
              </h2>
              <div className="h-[250px] w-full">
                {isLoading ? (
                  <div className="w-full h-full bg-muted/50 rounded-xl animate-pulse flex items-center justify-center">
                    <span className="text-muted-foreground font-medium">Loading Chart...</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} tickLine={false} axisLine={false} />
                      <YAxis tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px'}} itemStyle={{color: 'hsl(var(--foreground))'}} />
                      <Area type="monotone" dataKey="visitors" stroke="var(--primary)" fillOpacity={1} fill="url(#colorVisitors)" name="Visitors" strokeWidth={2} />
                      <Area type="monotone" dataKey="members" stroke="var(--secondary)" fillOpacity={1} fill="url(#colorMembers)" name="New Members" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Menfess Inbox */}
            {(allowedModules.includes("/admin/menfess") || currentUserRole === 'super_admin' || currentUserRole === 'admin') && (
              <div className="border border-border/50 shadow-sm rounded-2xl p-6 bg-card/50 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Inbox className="w-5 h-5 text-purple" />
                    Recent Menfess Inbox
                  </h2>
                  <Link href="/admin/menfess" className="text-xs font-bold text-primary hover:underline">Manage All</Link>
                </div>
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="text-sm text-muted-foreground animate-pulse">Loading inbox...</div>
                  ) : pendingMenfess.length === 0 ? (
                    <div className="text-sm text-muted-foreground bg-background p-4 rounded-xl border border-border/50 text-center">
                      ✨ Inbox is empty! All menfess have been moderated.
                    </div>
                  ) : (
                    pendingMenfess.map(post => (
                      <div key={post.id} className="p-4 rounded-xl bg-background border border-border/50 shadow-sm flex flex-col gap-2 group hover:border-purple/30 transition-colors">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple/10 text-purple border border-purple/20">
                            {post.to_name}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground">{safeFormatDate(post.created_at)}</span>
                        </div>
                        <p className="text-sm font-medium line-clamp-2 text-foreground/90">{post.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                            From: {post.from_name || "Anonymous"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

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

            {/* Upcoming Events Widget */}
            <div className="border border-border/50 shadow-sm rounded-2xl p-6 bg-card/50 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-secondary" />
                  Upcoming Events
                </h2>
                <Link href="/admin/events" className="text-xs font-bold text-primary hover:underline">View All</Link>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground animate-pulse">Loading events...</div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-background p-4 rounded-xl border border-border/50 text-center">
                    No upcoming events scheduled.
                  </div>
                ) : (
                  upcomingEvents.map(event => (
                    <div key={event.id} className="p-3 rounded-xl bg-background border border-border/50 shadow-sm flex items-start gap-3">
                      <div className="flex flex-col items-center justify-center min-w-[40px] px-2 py-1 bg-secondary/10 rounded-lg text-secondary border border-secondary/20">
                        <span className="text-xs font-bold uppercase">{format(new Date(event.date), 'MMM')}</span>
                        <span className="text-lg font-extrabold leading-none" style={{ fontFamily: "var(--font-space-grotesk)" }}>{format(new Date(event.date), 'dd')}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground line-clamp-1">{event.title}</h3>
                        <p className="text-xs font-medium text-muted-foreground line-clamp-1">{event.category || "General"}</p>
                      </div>
                    </div>
                  ))
                )}
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
                    <div key={log.id} className="p-4 rounded-xl bg-background border border-border/50 shadow-sm flex flex-col gap-2 group hover:border-primary/30 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                          <Activity className="w-3 h-3" />
                          {log.action}
                        </span>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                          <span className="text-[9px] font-medium text-muted-foreground/60 whitespace-nowrap">
                            {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-foreground/90 p-2.5 bg-muted/30 rounded-lg border border-border/30 mt-1 whitespace-pre-wrap">
                        {log.details}
                      </div>
                      <div className="text-[11px] font-semibold text-muted-foreground mt-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> 
                          {log.admin_email || "Admin"}
                        </span>
                        <span className="opacity-40 font-mono text-[9px]">ID: {log.id.slice(0, 8)}</span>
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

              {/* Profile Edit Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                
                <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
                  <div className="relative group w-20 h-20 rounded-full border border-border/50 bg-muted flex-shrink-0 overflow-hidden shadow-inner">
                    {avatarFile ? (
                      <img src={URL.createObjectURL(avatarFile)} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt="Current avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Users className="w-8 h-8" />
                      </div>
                    )}
                    
                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          if (e.target.files[0].size > 5 * 1024 * 1024) {
                            toast.error("Avatar size must be less than 5MB");
                            return;
                          }
                          setAvatarFile(e.target.files[0]);
                        }
                      }} />
                    </label>
                  </div>
                  
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-bold mb-1">Full Name</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-border/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 bg-background transition-colors" placeholder="e.g. John Doe" />
                  </div>
                </div>
                
                {isUpdatingProfile && uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={isUpdatingProfile}
                  className="w-full py-2 bg-background border border-border/50 hover:bg-muted font-bold transition-all rounded-xl disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                >
                  {isUpdatingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  {isUpdatingProfile ? "Saving..." : "Save Profile Details"}
                </button>
              </form>

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
