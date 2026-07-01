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
            const borderClass =
              feature.color === "primary"
                ? "neo-border-primary"
                : feature.color === "secondary"
                ? "neo-border-secondary"
                : "neo-border-accent";
            
            const shadowClass =
              feature.color === "primary"
                ? "neo-shadow-primary"
                : feature.color === "secondary"
                ? "neo-shadow-secondary"
                : "neo-shadow-accent";

            return (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className={`neo-hover ${borderClass} ${shadowClass} rounded-2xl p-8 bg-card flex flex-col h-full`}
              >
                <div
                  className="w-14 h-14 rounded-xl mb-6 flex items-center justify-center neo-border"
                  style={{
                    backgroundColor: `var(--${feature.color})`,
                    color: `var(--${feature.color}-foreground)`,
                  }}
                >
                  <Icon className="w-7 h-7" />
                </div>
                
                <h3
                  className="font-bold text-xl mb-3 text-foreground"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed flex-1">
                  {feature.description}
                </p>

                {/* Dummy Image Placeholder */}
                <div className="mt-6 w-full h-32 rounded-lg neo-border bg-muted overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-50">
                    <span className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
                      Image Placeholder
                    </span>
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
