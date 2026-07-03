"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Users, Calendar, MessageSquare, ShieldAlert, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const adminModules = [
    { name: "Events", icon: Calendar, path: "/admin/events", color: "primary", count: 6 },
    { name: "Team", icon: Users, path: "/admin/team", color: "secondary", count: 5 },
    { name: "Members", icon: Users, path: "/admin/members", color: "primary", count: 14 },
    { name: "FAQ", icon: MessageSquare, path: "/admin/faq", color: "accent", count: 3 },
    { name: "Ban List", icon: ShieldAlert, path: "/admin/banlist", color: "danger", count: 3 },
    { name: "Gallery", icon: ImageIcon, path: "/admin/gallery", color: "warning", count: 0 },
    { name: "Menfess", icon: MessageSquare, path: "/admin/menfess", color: "purple", count: 0 },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 neo-border rounded-2xl p-6 bg-card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center neo-border">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                LDV Management Content
              </h1>
              <p className="text-sm font-medium text-muted-foreground">Manage your community content.</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl neo-border neo-press font-bold text-sm bg-background hover:bg-danger/10 hover:text-danger transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </header>

        {/* Modules Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminModules.map((mod) => (
            <Link
              key={mod.name}
              href={mod.path}
              className="neo-border neo-shadow-sm neo-hover rounded-2xl p-6 bg-card flex flex-col justify-between aspect-square"
            >
              <div
                className="w-14 h-14 rounded-xl neo-border flex items-center justify-center mb-4"
                style={{
                  backgroundColor: `var(--${mod.color === "danger" ? "danger" : mod.color})`,
                  color: mod.color === "accent" ? "var(--accent-foreground)" : "var(--primary-foreground)"
                }}
              >
                <mod.icon className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  {mod.name}
                </h2>
                <p className="text-muted-foreground font-medium mt-1">Manage entries</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
