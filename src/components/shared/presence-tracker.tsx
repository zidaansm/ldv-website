"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function PresenceTracker() {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("public:visitors", {
      config: {
        presence: {
          key: crypto.randomUUID(),
        },
      },
    });

    channel.on("presence", { event: "sync" }, () => {
      // Just keep the connection alive
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ online_at: new Date().toISOString() });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
