"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";
import { cn } from "@/lib/utils";

export function AdminHeader() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Do not show header on login page
  if (pathname === "/admin/login") return null;

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="font-extrabold text-lg tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>LDV Admin</h2>
        </div>
        
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-2 text-foreground/80 hover:text-foreground"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute top-[60px] bottom-0 left-0 w-72 bg-card border-r border-border/50"
            onClick={e => e.stopPropagation()}
          >
            <AdminSidebar className="static w-full h-full border-r-0" onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
