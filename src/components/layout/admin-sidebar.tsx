"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, Users, Calendar, MessageSquare, ShieldAlert, 
  ImageIcon, Activity, Globe, BookOpen, UserPlus, LogOut, ChevronRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const allModules = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { name: "Events", icon: Calendar, path: "/admin/events" },
  { name: "Staff", icon: Users, path: "/admin/team" },
  { name: "Members", icon: UserPlus, path: "/admin/members" },
  { name: "FAQ", icon: MessageSquare, path: "/admin/faq" },
  { name: "Banlist", icon: ShieldAlert, path: "/admin/banlist" },
  { name: "Menfess", icon: Activity, path: "/admin/menfess" },
  { name: "Gallery", icon: ImageIcon, path: "/admin/gallery" },
  { name: "Twitter Bases", icon: MessageSquare, path: "/admin/bases" },
  { name: "Collaborations", icon: Globe, path: "/admin/collaborations" },
  { name: "Story", icon: BookOpen, path: "/admin/story" },
  { name: "Social Links", icon: Globe, path: "/admin/socials" },
];

export function AdminSidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [allowedPaths, setAllowedPaths] = useState<string[] | null>(null);

  useEffect(() => {
    const fetchRoleAndPermissions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('id', session.user.id).single();
        if (roleData) {
          setCurrentUserRole(roleData.role);
          
          const { data: permData } = await supabase.from('role_permissions')
            .select('allowed_modules')
            .eq('role', roleData.role)
            .single();
            
          if (permData && permData.allowed_modules) {
            setAllowedPaths(permData.allowed_modules);
          }
        }
      }
    };
    fetchRoleAndPermissions();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const allPossibleModules = [...allModules, { name: "Accounts", icon: ShieldAlert, path: "/admin/users" }];
  
  let allowedModules = allPossibleModules;
  if (allowedPaths) {
    allowedModules = allPossibleModules.filter(m => allowedPaths.includes(m.path));
  } else {
    // Fallback before permissions load
    allowedModules = [{ name: "Dashboard", icon: LayoutDashboard, path: "/admin" }];
  }

  if (pathname === "/admin/login") return null;

  return (
    <aside className={cn("fixed left-0 top-0 z-40 h-screen w-72 bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col", className)}>
      <div className="p-6 flex items-center gap-3 border-b border-border/50">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-extrabold text-xl tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>LDV Admin</h2>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{currentUserRole.replace('_', ' ') || 'Loading...'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-none">
        {allowedModules.map((module) => {
          const isActive = pathname === module.path || (module.path !== "/admin" && pathname.startsWith(module.path + "/"));
          
          return (
            <Link
              key={module.path}
              href={module.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <module.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              {module.name}
              {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
