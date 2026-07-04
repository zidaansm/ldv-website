"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Eye } from "lucide-react";

export function VisitorBadge() {
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("public:visitors");

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      // Count total unique connections in the channel
      let count = 0;
      for (const id in state) {
        count += state[id].length;
      }
      setVisitorCount(count);
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-foreground text-background px-3 py-1.5 rounded-full neo-shadow-sm neo-border border-2 font-bold text-sm" style={{ fontFamily: "var(--font-space-grotesk)" }}>
      <Eye className="w-4 h-4 text-green-400 animate-pulse" />
      <span>{visitorCount} Online</span>
    </div>
  );
}
