"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track if pathname is available and we are in browser
    if (!pathname || typeof window === "undefined") return;

    // Send tracking ping
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(err => console.error("Tracking error:", err)); // Silently catch errors so it doesn't disrupt user
  }, [pathname]);

  return null; // This component doesn't render anything
}
