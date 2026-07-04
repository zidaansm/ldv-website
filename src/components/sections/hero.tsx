"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, ArrowRight, Users, Activity, Calendar } from "lucide-react";
import { Container } from "@/components/layout";
import { GeoShapes } from "@/components/decorations/geo-shapes";
import { RetroTV } from "@/components/decorations/retro-tv";
import { RetroRobot } from "@/components/decorations/retro-robot";
import { SITE_CONFIG, COMMUNITY_STATS } from "@/lib/constants";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { useTranslation } from "@/lib/i18n/LanguageContext";

export function Hero() {
  const { t } = useTranslation();
  
  const [stats, setStats] = useState({
    members: COMMUNITY_STATS.members,
    online: COMMUNITY_STATS.online,
  });

  useEffect(() => {
    const fetchDiscordStats = async () => {
      try {
        const res = await fetch("https://discord.com/api/v9/invites/ladolcevita?with_counts=true");
        if (res.ok) {
          const data = await res.json();
          if (data.approximate_member_count && data.approximate_presence_count) {
            setStats({
              members: data.approximate_member_count,
              online: data.approximate_presence_count,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch Discord stats", error);
      }
    };
    
    fetchDiscordStats();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden geo-grid">
      {/* Animated Background Shapes */}
      <GeoShapes />

      {/* Floating 3D Retro TV (Right) */}
      <div className="absolute right-0 lg:right-10 top-1/2 -translate-y-1/2 w-1/3 hidden lg:block z-20 transition-opacity" style={{ pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", width: "100%", height: "100%" }}>
          <RetroTV />
        </div>
      </div>

      {/* Floating 3D Retro Robot (Left) */}
      <div className="absolute left-0 lg:left-10 -bottom-24 w-1/4 hidden lg:block z-20 transition-opacity" style={{ pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto", width: "100%", height: "100%" }}>
          <RetroRobot />
        </div>
      </div>

      <Container className="relative z-10">
        <motion.div
          className="max-w-4xl mx-auto text-center space-y-8"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >

          {/* Main Headline */}
          <motion.div variants={fadeInUp} className="space-y-4">
            <h1
              className="font-extrabold tracking-tighter leading-[1.1]"
              style={{
                fontSize: "var(--text-heading-xl)",
                fontFamily: "var(--font-space-grotesk)",
              }}
            >
              <motion.span 
                className="text-brand-purple block mb-2 text-3xl md:text-5xl tracking-widest uppercase font-bold"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {t("hero.welcome")}
              </motion.span>
              <motion.span 
                className="inline-flex overflow-hidden bg-clip-text text-transparent pb-4"
                style={{
                  backgroundImage: "linear-gradient(90deg, var(--foreground), var(--accent), var(--secondary), var(--foreground))",
                  backgroundSize: "300% 100%",
                }}
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.08, delayChildren: 1 }
                  }
                }}
              >
                {t("hero.title").split("").map((char: string, index: number) => (
                  <motion.span
                    key={index}
                    variants={{
                      hidden: { y: "100%", opacity: 0, rotateX: -90 },
                      visible: { 
                        y: 0, 
                        opacity: 1,
                        rotateX: 0,
                        transition: { type: "spring", damping: 12, stiffness: 200 }
                      }
                    }}
                    className="inline-block hover:scale-110 transition-transform duration-300"
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
              {t("hero.description")}
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href={SITE_CONFIG.discordInvite}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-3 neo-border neo-shadow-secondary neo-press rounded-2xl px-8 py-4 font-bold text-lg bg-primary text-primary-foreground w-full sm:w-auto transition-all"
            >
              <MessageCircle className="w-6 h-6" />
              {t("hero.joinServer")}
            </a>
            
            <a
              href="#about"
              className="group inline-flex items-center justify-center gap-3 neo-border neo-shadow-sm neo-press rounded-2xl px-8 py-4 font-bold text-lg bg-card text-foreground hover:bg-muted w-full sm:w-auto transition-all"
            >
              {t("hero.explore")}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Quick Stats Banner */}
          <motion.div variants={fadeInUp} className="pt-12 flex justify-center">
             <div className="inline-flex flex-wrap items-center justify-center gap-6 md:gap-12 neo-border neo-shadow-sm rounded-2xl px-8 py-6 bg-card">
               <div className="flex flex-col items-center">
                 <div className="flex items-center gap-2">
                   <Users className="w-5 h-5 text-brand-purple" />
                   <span className="font-extrabold text-2xl">{stats.members.toLocaleString("en-US")}+</span>
                 </div>
                 <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("hero.stats.members")}</span>
               </div>
               <div className="w-px h-12 bg-[var(--border)] hidden sm:block"></div>
               <div className="flex flex-col items-center">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                   <span className="font-extrabold text-2xl">{stats.online.toLocaleString("en-US")}</span>
                 </div>
                 <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">ONLINE NOW</span>
               </div>
               <div className="w-px h-12 bg-[var(--border)] hidden sm:block"></div>
               <div className="flex flex-col items-center">
                 <div className="flex items-center gap-2">
                   <Calendar className="w-5 h-5 text-secondary" />
                   <span className="font-extrabold text-2xl text-foreground">150+</span>
                 </div>
                 <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("hero.stats.events")}</span>
               </div>
             </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
