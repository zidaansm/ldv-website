"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track if pathname is available and we are in browser
    if (!pathname || typeof window === "undefined") return;

    // Check if we already tracked this user in the current session
    // We use a specific key per path so moving between pages still counts as separate views,
    // but refreshing the SAME page does not count again.
    // If you want ONLY 1 hit per session regardless of what pages they visit, use a single global key.
    // Given the context (Unique Visitors), a single global session key is better.
    const sessionKey = "ldv_visited_session";
    
    if (!sessionStorage.getItem(sessionKey)) {
      // Send tracking ping
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
      })
      .then(res => {
        if (res.ok) {
          // Mark as visited for this session only if successful
          sessionStorage.setItem(sessionKey, "true");
        }
      })
      .catch(err => console.error("Tracking error:", err)); // Silently catch errors
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}
