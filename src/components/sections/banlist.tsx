"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Gavel, Calendar } from "lucide-react";
import { Section } from "@/components/layout";
import { SectionHeading } from "@/components/shared";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function BanList() {
  const { t } = useTranslation();
  const [banList, setBanList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBanList() {
      const { data } = await supabase.from("banlist").select("*").order("banned_at", { ascending: false });
      if (data) setBanList(data);
    }
    fetchBanList();
  }, []);
  return (
    <Section id="banlist" withPattern>
      <div className="space-y-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full neo-border bg-danger text-primary-foreground font-bold text-sm tracking-wider uppercase shadow-[4px_4px_0_0_var(--foreground)]">
            <ShieldAlert className="w-4 h-4" />
            {t("banlist.policy")}
          </div>
          <h2
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {t("banlist.title")}
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {t("banlist.subtitle")}
          </p>
        </div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {banList.map((ban) => (
            <motion.div
              key={ban.id}
              variants={fadeInUp}
              className="neo-border neo-shadow-sm rounded-2xl bg-card overflow-hidden relative group"
            >
              {/* "BANNED" Stamp Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 opacity-15 pointer-events-none transition-all duration-300 group-hover:opacity-50 group-hover:scale-110 group-hover:-rotate-6 z-0">
                <span 
                  className="font-black text-5xl md:text-6xl text-danger uppercase tracking-tighter border-4 border-danger px-4 py-2 rounded-xl inline-block" 
                  style={{ 
                    fontFamily: "var(--font-space-grotesk)",
                  }}>
                  {t("banlist.bannedStamp")}
                </span>
              </div>

              <div className="p-6 border-b-[2px] border-[var(--border)] flex justify-between items-start bg-danger/10">
                <div>
                  <h3 className="font-bold text-xl text-danger" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    {ban.username}
                  </h3>
                  <p className="text-sm font-semibold text-muted-foreground">{t("banlist.duration")} {ban.duration}</p>
                </div>
                <div className="w-10 h-10 rounded-full neo-border bg-danger text-primary-foreground flex items-center justify-center shrink-0">
                  <Gavel className="w-5 h-5" />
                </div>
              </div>

              <div className="p-6 space-y-4 relative z-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{t("banlist.reason")}</p>
                  <p className="font-medium text-foreground">{ban.reason}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-[var(--muted)] px-3 py-2 rounded-lg border-2 border-[var(--border)] border-dashed">
                  <Calendar className="w-4 h-4" />
                  Banned on: {new Date(ban.banned_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
