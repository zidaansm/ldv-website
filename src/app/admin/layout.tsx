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

        if (role === 'event_organizer') {
          // Event Organizers can only access dashboard and events management
          if (pathname !== "/admin" && !pathname.startsWith("/admin/events")) {
            router.push("/admin");
            return;
          }
        } else if (role === 'unassigned') {
          // Unassigned users can only view dashboard (where they will see 0 stats due to RLS)
          if (pathname !== "/admin") {
             router.push("/admin");
             return;
          }
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin-slow w-12 h-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const isLoginPage = pathname === "/admin/login";

  return (
    <div className="min-h-screen bg-background text-foreground flex">
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
