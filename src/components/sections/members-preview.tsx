"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

type Member = {
  id: string;
  name: string;
  bio: string;
  avatar_url: string;
  accent_color: string;
};

interface MembersPreviewProps {
  direction?: "left" | "right";
  speed?: number;
}

export function MembersPreview({ direction = "left", speed = 40 }: MembersPreviewProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const supabase = createClient();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchMembers = async () => {
      // Fetch more members so we have a pool to randomize from
      const { data } = await supabase
        .from("members")
        .select("*")
        .limit(50);
      
      if (data && data.length > 0) {
        // Shuffle the array to get a random order every time it mounts
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        // Take up to 15 random members to keep the marquee interesting
        const selectedMembers = shuffled.slice(0, 15);
        // Duplicate the list 3 times so it scrolls infinitely without gaps
        setMembers([...selectedMembers, ...selectedMembers, ...selectedMembers]);
      }
    };
    fetchMembers();
  }, []);

  if (members.length === 0) return null;

  return (
    <section className="py-8 bg-background overflow-hidden relative border-t-0">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      <div className="flex whitespace-nowrap">
        <motion.div
          animate={{ x: direction === "left" ? ["0%", "-33.33%"] : ["-33.33%", "0%"] }}
          transition={{ 
            repeat: Infinity, 
            ease: "linear", 
            duration: speed 
          }}
          className="flex gap-6 items-center px-3"
        >
          {members.map((member, i) => {
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
              <div 
                key={`${member.id}-${i}`}
                className="flex items-center gap-4 bg-card rounded-2xl p-3 shrink-0 border-[3px] border-[var(--neo-border)] cursor-pointer group hover:-translate-y-1 transition-transform"
                style={{ 
                  minWidth: "280px", 
                  boxShadow: `4px 4px 0 ${color}` 
                }}
              >
                <div 
                className="w-14 h-14 rounded-full border-2 border-[var(--neo-border)] shrink-0 overflow-hidden shadow-[2px_2px_0_var(--neo-border)] flex items-center justify-center relative z-10"
                style={{ backgroundColor: color }}
              >
                {member.avatar_url ? (
                  <Image src={member.avatar_url} alt={member.name} fill sizes="56px" className="object-contain group-hover:scale-110 transition-transform" draggable="false" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-white text-xl">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-bold text-foreground text-lg truncate group-hover:text-primary transition-colors">{member.name}</span>
                  <span className="text-xs text-muted-foreground font-semibold truncate italic">&quot;{member.bio}&quot;</span>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
