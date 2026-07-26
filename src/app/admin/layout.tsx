"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session && pathname !== "/admin/login") {
        router.push("/admin/login");
        return;
      } else if (session && pathname === "/admin/login") {
        router.push("/admin");
        return;
      }

      if (session) {
        // Fetch role and enforce RBAC
        const { data } = await supabase.from('user_roles').select('role').eq('id', session.user.id).single();
        const role = data?.role || 'unassigned';

        if (role === 'unassigned') {
          // Unassigned users can only view dashboard (where they will see 0 stats due to RLS)
          if (pathname !== "/admin") {
             router.push("/admin");
             return;
          }
        } else {
          // Fetch dynamic permissions for this role
          const { data: permData } = await supabase.from('role_permissions').select('allowed_modules').eq('role', role).single();
          
          if (permData && permData.allowed_modules) {
             const allowed = [...permData.allowed_modules, "/admin/team-chat", "/admin/tasks", "/admin/report"];
             const isAllowed = allowed.some((m: string) => pathname === m || (m !== "/admin" && pathname.startsWith(m + "/")));
             
             // Dashboard (/admin) is always accessible to prevent redirect loops
             if (!isAllowed && pathname !== "/admin") {
                router.push("/admin");
                return;
             }
          }
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (!session && pathname !== "/admin/login") {
        router.push("/admin/login");
      } else if (session && pathname === "/admin/login") {
        router.push("/admin");
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router, supabase.auth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center admin-theme">
        <div className="animate-spin-slow w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const isLoginPage = pathname === "/admin/login";

  return (
    <div className="min-h-screen bg-background text-foreground flex admin-theme">
      {!isLoginPage && <AdminSidebar className="hidden lg:flex" />}
      {!isLoginPage && <AdminHeader />}
      
      <main className={cn(
        "flex-1 flex flex-col min-h-screen",
        !isLoginPage && "lg:pl-72 pt-[60px] lg:pt-0" // Add padding for sidebar and mobile header
      )}>
        {children}
      </main>
    </div>
  );
}
