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

        <div className="relative overflow-hidden py-8 -mx-4 px-4 sm:mx-0 sm:px-0">
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
                    purple: "#E9D5FF", // pastel purple
                    pink: "#FBCFE8",   // pastel pink
                    cyan: "#CFFAFE",   // pastel cyan
                    danger: "#FECACA", // pastel red
                    success: "#BBF7D0",// pastel green
                    warning: "#FEF08A",// pastel yellow
                    "neo-red": "#FF2B2B",
                    "neo-yellow": "#FFD600",
                    "neo-blue": "#0047FF",
                    "neo-purple": "#7B00FF",
                    "neo-pink": "#FF006E",
                    "neo-orange": "#FF5C00",
                    "neo-green": "#00C44F",
                    "neo-dark": "#1A1A2E",
                  };
                  
                  // Use a solid contrasting background based on their accent color, defaulting to white
                  const bgColor = colorMap[member.accent_color] || "#ffffff";
                  // The text color for the badge (black for light backgrounds, white for dark)
                  const isDarkBg = member.accent_color?.startsWith('neo-') && !member.accent_color.includes('yellow');

                  return (
                    <motion.div
                      key={`${blockIdx}-${member.id}`}
                      className="w-[280px] shrink-0 rounded-none p-6 flex flex-col items-center text-center cursor-pointer relative"
                      style={{
                        backgroundColor: "#ffffff",
                        border: `4px solid #000000`,
                        boxShadow: `8px 8px 0px 0px #000000`,
                      }}
                      whileHover={{
                        x: 4,
                        y: 4,
                        boxShadow: "0px 0px 0px 0px #000000",
                      }}
                      transition={{ duration: 0.1 }}
                    >
                      {/* Roblox Avatar from Supabase */}
                      <div className="w-40 h-40 mb-6 flex items-center justify-center relative">
                        <img
                          src={member.avatar_url}
                          alt={`${member.name} Roblox Avatar`}
                          className="w-full h-full object-cover filter drop-shadow-md"
                          loading="lazy"
                          draggable="false"
                        />
                      </div>

                      <div className="space-y-4 w-full flex flex-col items-center">
                        <h3
                          className="font-black text-2xl text-black tracking-tight"
                          style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                          {member.name}
                        </h3>
                        
                        {/* Neobrutalism Role Badge */}
                        <div 
                          className="px-4 py-2 font-bold text-xs uppercase tracking-widest text-black"
                          style={{ 
                            backgroundColor: bgColor,
                            border: "3px solid #000000",
                            boxShadow: "3px 3px 0px 0px #000000"
                          }}
                        >
                          {member.role === "Owner / Founder" ? t("team.role.owner") : 
                           member.role === "Server Admin" ? t("team.role.admin") :
                           member.role === "Moderator" ? t("team.role.mod") :
                           member.role === "Event Manager" ? t("team.role.event") : member.role}
                        </div>
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
