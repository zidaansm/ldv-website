"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Gamepad2, CalendarHeart, Users, ShieldCheck, Trophy, Sparkles } from "lucide-react";

const scrollItems = [
  {
    text: "MORE THAN JUST A SERVER",
    icon: Users,
    desc: "12K+ members and counting",
    color: "var(--primary)",
  },
  {
    text: "EPIC GAMING SESSIONS",
    icon: Gamepad2,
    desc: "Valorant, Minecraft, CS2 & more",
    color: "var(--secondary)",
  },
  {
    text: "PREMIUM EVENTS",
    icon: CalendarHeart,
    desc: "Movie nights, karaoke & tournaments",
    color: "var(--accent)",
  },
  {
    text: "SAFE & ACTIVE COMMUNITY",
    icon: ShieldCheck,
    desc: "24/7 moderation & voice channels",
    color: "var(--primary)",
  },
  {
    text: "COMPETITIVE TOURNAMENTS",
    icon: Trophy,
    desc: "Prove your skills & win prizes",
    color: "var(--secondary)",
  },
  {
    text: "EXPERIENCE THE SWEET LIFE",
    icon: Sparkles,
    desc: "Custom bots, roles & premium perks",
    color: "var(--accent)",
  },
];

export function ScrollText() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Main horizontal movement
  const x = useTransform(scrollYProgress, [0, 1], ["5%", "-75%"]);

  // Smooth fade-in for the sticky container
  const stickyOpacity = useTransform(scrollYProgress, [0, 0.03, 0.92, 1], [0, 1, 1, 0]);
  const stickyScale = useTransform(scrollYProgress, [0, 0.04, 0.92, 1], [0.95, 1, 1, 0.95]);

  // Floating shapes that move at different speeds (parallax layers)
  const floatX1 = useTransform(scrollYProgress, [0, 1], ["0%", "-120%"]);
  const floatX2 = useTransform(scrollYProgress, [0, 1], ["0%", "-60%"]);
  const floatY1 = useTransform(scrollYProgress, [0, 0.5, 1], ["0vh", "-8vh", "0vh"]);
  const floatY2 = useTransform(scrollYProgress, [0, 0.5, 1], ["0vh", "6vh", "0vh"]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <section
      ref={containerRef}
      className="h-[400vh] relative"
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.div
          style={{ opacity: stickyOpacity, scale: stickyScale }}
          className="w-full h-full bg-foreground text-background flex flex-col justify-center relative"
        >
          {/* Parallax floating geometric shapes */}
          <motion.div
            style={{ x: floatX1, y: floatY1, rotate: rotate1 }}
            className="absolute top-[15%] left-[20%] w-24 h-24 md:w-40 md:h-40 rounded-3xl opacity-[0.06] border-4 border-background"
          />
          <motion.div
            style={{ x: floatX2, y: floatY2, rotate: rotate2 }}
            className="absolute bottom-[20%] left-[60%] w-16 h-16 md:w-28 md:h-28 rounded-full opacity-[0.06] border-4 border-background"
          />
          <motion.div
            style={{ x: floatX1, y: floatY2 }}
            className="absolute top-[60%] left-[40%] w-20 h-20 md:w-32 md:h-32 opacity-[0.04] border-4 border-primary rotate-45"
          />
          <motion.div
            style={{ x: floatX2, y: floatY1, rotate: rotate1 }}
            className="absolute top-[30%] left-[75%] w-12 h-12 md:w-20 md:h-20 rounded-2xl opacity-[0.05] bg-primary"
          />

          {/* Main horizontal scrolling content */}
          <motion.div
            style={{ x }}
            className="flex items-center gap-0 pl-[10vw] whitespace-nowrap"
          >
            {scrollItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-center shrink-0">
                  {/* Text + Item Card Group */}
                  <div className="flex flex-col items-start gap-4 md:gap-6 pr-6 md:pr-12">
                    {/* Big Text */}
                    <span
                      className="font-extrabold text-[11vw] md:text-[8vw] uppercase tracking-tighter leading-none"
                      style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                      {item.text}
                    </span>

                    {/* Floating Item Card */}
                    <div
                      className="flex items-center gap-3 md:gap-4 rounded-2xl px-5 py-3 md:px-6 md:py-4 border-2 border-background/10"
                      style={{ backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)` }}
                    >
                      <div
                        className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        <Icon className="w-5 h-5 md:w-6 md:h-6 text-background" />
                      </div>
                      <span className="text-sm md:text-base font-semibold opacity-70 whitespace-nowrap">
                        {item.desc}
                      </span>
                    </div>
                  </div>

                  {/* Dot separator (skip last) */}
                  {index < scrollItems.length - 1 && (
                    <span
                      className="text-primary text-[5vw] md:text-[4vw] mx-6 md:mx-12 shrink-0"
                    >
                      •
                    </span>
                  )}
                </div>
              );
            })}
          </motion.div>

          {/* Scroll progress indicator at the bottom */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-[0.3em] opacity-30 font-medium">Scroll to explore</span>
            <motion.div className="w-48 h-1 rounded-full bg-background/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
