"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Member = {
  id: string;
  name: string;
  motto: string;
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
          {members.map((member, i) => (
            <div 
              key={`${member.id}-${i}`}
              className="flex items-center gap-3 bg-card neo-border rounded-xl p-3 shrink-0"
              style={{ minWidth: "250px" }}
            >
              <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.name} className="w-full h-full object-contain drop-shadow-md" />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center font-bold text-white rounded-lg border-2 border-black overflow-hidden"
                    style={{ backgroundColor: `var(--${member.accent_color})` }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-foreground truncate">{member.name}</span>
                <span className="text-xs text-muted-foreground font-semibold truncate">{member.motto}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
