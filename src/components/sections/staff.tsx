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
          <div className="flex">
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
                {staffList.map((member, index) => {
                  const colorMap: Record<string, string> = {
                    purple: "#E9D5FF", pink: "#FBCFE8", cyan: "#CFFAFE",
                    danger: "#FECACA", success: "#BBF7D0", warning: "#FEF08A",
                    "neo-red": "#FF2B2B", "neo-yellow": "#FFD600", "neo-blue": "#0047FF",
                    "neo-purple": "#7B00FF", "neo-pink": "#FF006E", "neo-orange": "#FF5C00",
                    "neo-green": "#00C44F", "neo-dark": "#1A1A2E",
                  };
                  
                  const bgColor = colorMap[member.accent_color] || "#CFFAFE";
                  const rotationDirection = index % 2 === 0 ? -2 : 2;
                  return (
                    <motion.div
                      key={`${blockIdx}-${member.id}`}
                      className="w-[280px] shrink-0 flex flex-col cursor-pointer relative bg-card border-4 border-foreground group/card"
                      style={{
                        boxShadow: `8px 8px 0px 0px var(--foreground)`,
                      }}
                      whileHover={{
                        y: -8,
                        x: -4,
                        boxShadow: `12px 16px 0px 0px var(--foreground)`,
                        rotate: rotationDirection === 2 ? 1 : -1
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      {/* OS Title Bar */}
                      <div className="h-10 border-b-4 border-foreground px-3 flex items-center justify-between" style={{ backgroundColor: bgColor }}>
                        {/* Fake buttons */}
                        <div className="flex gap-2">
                           <div className="w-3.5 h-3.5 rounded-full border-2 border-foreground bg-background"></div>
                           <div className="w-3.5 h-3.5 rounded-full border-2 border-foreground bg-background"></div>
                           <div className="w-3.5 h-3.5 rounded-full border-2 border-foreground bg-background"></div>
                        </div>
                        {/* Role Text */}
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground opacity-80">
                          {member.role === "Owner / Founder" ? t("team.role.owner") : 
                           member.role === "Server Admin" ? t("team.role.admin") :
                           member.role === "Moderator" ? t("team.role.mod") :
                           member.role === "Event Manager" ? t("team.role.event") : member.role}
                        </span>
                      </div>

                      {/* Main Content Area */}
                      <div className="p-6 flex flex-col items-center justify-center bg-card relative overflow-hidden h-[240px]">
                         {/* Subtle grid pattern */}
                         <div className="absolute inset-0 opacity-10 pointer-events-none" 
                              style={{ 
                                backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)", 
                                backgroundSize: "20px 20px",
                                backgroundPosition: "center center"
                              }} 
                         />

                         {/* Avatar */}
                         <img
                           src={member.avatar_url}
                           alt={`${member.name}`}
                           className="w-48 h-48 object-cover filter drop-shadow-xl relative z-10 group-hover/card:scale-110 group-hover/card:-translate-y-2 transition-all duration-300"
                           loading="lazy"
                           draggable="false"
                         />
                      </div>

                      {/* Bottom Name Bar */}
                      <div className="border-t-4 border-foreground p-4 bg-background z-20 flex justify-center items-center">
                         <h3 className="font-black text-2xl text-foreground tracking-tight uppercase" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                            {member.name}
                         </h3>
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
