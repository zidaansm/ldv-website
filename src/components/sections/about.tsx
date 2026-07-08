"use client";

import { motion } from "framer-motion";
import { Gamepad2, CalendarHeart, Users, ShieldCheck, Trophy, Sparkles } from "lucide-react";
import { Section } from "@/components/layout";
import { SectionHeading } from "@/components/shared";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const features = [
  {
    title: "Gaming Sessions",
    description: "Daily LFG, ranked grinds, and casual play across Valorant, Minecraft, CS2, and more.",
    icon: Gamepad2,
    color: "primary",
  },
  {
    title: "Epic Events",
    description: "Weekly movie nights, karaoke, and custom game tournaments with prizes.",
    icon: CalendarHeart,
    color: "secondary",
  },
  {
    title: "Active Community",
    description: "24/7 active voice channels and text chats. You'll never play alone again.",
    icon: Users,
    color: "accent",
  },
  {
    title: "Safe Space",
    description: "Strict moderation and zero-tolerance for toxicity ensures a welcoming environment.",
    icon: ShieldCheck,
    color: "primary",
  },
  {
    title: "Tournaments",
    description: "Competitive e-sports brackets for our sweaty gamers. Prove your skills.",
    icon: Trophy,
    color: "secondary",
  },
  {
    title: "Premium Perks",
    description: "Custom bots, high-quality audio, and exclusive roles for active members.",
    icon: Sparkles,
    color: "accent",
  },
];

export function About() {
  return (
    <Section id="about" withPattern>
      <div className="space-y-16">
        <SectionHeading
          title="What is La Dolce Vita?"
          subtitle="More than just a server. LDV is a premium digital space where gamers, creators, and friends come together to experience the sweet life."
          accentColor="purple"
        />

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="group cursor-pointer relative p-6 flex flex-col h-full overflow-hidden transition-all duration-300"
                style={{
                  backgroundColor: `var(--${feature.color})`,
                  color: `var(--${feature.color}-foreground)`,
                  border: "4px solid var(--foreground)",
                  boxShadow: "8px 8px 0px 0px var(--foreground)"
                }}
                whileHover={{
                  y: -8,
                  x: -4,
                  boxShadow: "12px 12px 0px 0px var(--foreground)"
                }}
              >
                {/* Background Giant Number */}
                <div className="absolute -bottom-6 -right-2 text-[140px] font-black opacity-10 pointer-events-none mix-blend-overlay leading-none">
                  0{idx + 1}
                </div>

                {/* Top header with Icon */}
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="bg-background border-4 border-foreground p-3 group-hover:rotate-6 transition-transform duration-300"
                       style={{ boxShadow: "4px 4px 0px 0px var(--foreground)" }}>
                     <Icon className="w-8 h-8 text-foreground" />
                  </div>
                  {/* Decorative tag */}
                  <div className="px-3 py-1 bg-foreground text-background text-[10px] font-black uppercase tracking-widest border-2 border-foreground">
                     LDV // {idx + 1}
                  </div>
                </div>
                
                <h3
                  className="font-black text-2xl mb-4 uppercase tracking-tight relative z-10"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {feature.title}
                </h3>
                
                <p className="font-bold leading-relaxed flex-1 relative z-10 text-sm opacity-90">
                  {feature.description}
                </p>

                {/* Brutalist Divider */}
                <div className="mt-8 pt-5 border-t-4 border-current/20 flex justify-between items-center relative z-10">
                   <span className="font-black text-[10px] uppercase tracking-widest">Learn More</span>
                   <div className="w-8 h-8 border-4 border-current flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors duration-300">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                   </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </Section>
  );
}
