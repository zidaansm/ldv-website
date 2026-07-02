"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import Image from "next/image";
import { Section } from "@/components/layout";
import { SectionHeading } from "@/components/shared";
import { staggerContainer, fadeInUp, hoverLift } from "@/lib/animations";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function Staff() {
  const { t } = useTranslation();
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStaff() {
      const { data } = await supabase.from("staff").select("*").order("created_at", { ascending: true });
      if (data) setStaffList(data);
    }
    fetchStaff();
  }, []);

  return (
    <Section id="team" withPattern>
      <div className="space-y-16">
        <SectionHeading
          title={t("team.title")}
          subtitle={t("team.subtitle")}
          accentColor="cyan"
        />

        <div className="relative overflow-hidden py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Gradient Edges for Premium Look */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex group">
            {/* We render two identical blocks that slide to the left */}
            {[1, 2].map((blockIdx) => (
              <motion.div
                key={blockIdx}
                className="flex gap-8 pr-8 shrink-0"
                animate={{ x: ["0%", "-100%"] }}
                transition={{
                  ease: "linear",
                  duration: 25,
                  repeat: Infinity,
                }}
              >
                {staffList.map((member) => {
                  const colorMap: Record<string, string> = {
                    purple: "#6b2157",
                    pink: "#db2777",
                    cyan: "#0891b2",
                    danger: "#e53e3e",
                    success: "#38a169",
                    warning: "#d69e2e",
                    "neo-red": "#FF2B2B",
                    "neo-yellow": "#FFD600",
                    "neo-blue": "#0047FF",
                    "neo-purple": "#7B00FF",
                    "neo-pink": "#FF006E",
                    "neo-orange": "#FF5C00",
                    "neo-green": "#00C44F",
                    "neo-dark": "#1A1A2E",
                  };
                  const color = colorMap[member.accent_color] || colorMap.purple;

                  return (
                    <motion.div
                      key={`${blockIdx}-${member.id}`}
                      className="w-[280px] shrink-0 rounded-3xl p-6 bg-card flex flex-col items-center text-center cursor-pointer"
                      style={{
                        border: `3px solid ${color}`,
                        boxShadow: `4px 4px 0 ${color}`,
                      }}
                      whileHover={{
                        x: -4,
                        y: -4,
                        boxShadow: "10px 10px 0 0 var(--neo-border)",
                      }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {/* Roblox Avatar from Supabase */}
                      <div className="w-40 h-40 mb-6 flex items-center justify-center relative drop-shadow-lg">
                        <img
                          src={member.avatar_url}
                          alt={`${member.name} Roblox Avatar`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          draggable="false"
                        />
                      </div>

                      <div className="space-y-1">
                        <h3
                          className="font-bold text-xl text-foreground"
                          style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                          {member.name}
                        </h3>
                        <p className="text-sm font-semibold uppercase tracking-wider" style={{ color }}>
                          {member.role === "Owner / Founder" ? t("team.role.owner") : 
                           member.role === "Server Admin" ? t("team.role.admin") :
                           member.role === "Moderator" ? t("team.role.mod") :
                           member.role === "Event Manager" ? t("team.role.event") : member.role}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
