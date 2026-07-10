"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";
import { Gamepad2, CalendarHeart, Users, ShieldCheck, Trophy, Rocket } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const featureData = [
  {
    key: "gaming",
    icon: Gamepad2,
    color: "primary",
  },
  {
    key: "events",
    icon: CalendarHeart,
    color: "secondary",
  },
  {
    key: "community",
    icon: Users,
    color: "foreground",
  },
  {
    key: "safety",
    icon: ShieldCheck,
    color: "primary",
  },
  {
    key: "tournaments",
    icon: Trophy,
    color: "secondary",
  },
  {
    key: "growth",
    icon: Rocket,
    color: "foreground",
  }
];

export function AboutGSAP() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const scrollContainer = scrollContainerRef.current;
    const icon = iconRef.current;
    const heading = headingRef.current;

    if (!section || !scrollContainer || !icon || !heading) return;

    let mm = gsap.matchMedia();

    // Desktop Animation (Horizontal Scroll)
    mm.add("(min-width: 768px)", () => {
      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // 1. Split Text Animation for Heading
      const text = new SplitType(heading, { types: "chars,words" });
      
      if (!isReduced) {
        gsap.from(text.chars, {
          scrollTrigger: {
            trigger: heading,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
          y: 50,
          opacity: 0,
          rotationX: -90,
          stagger: 0.02,
          duration: 0.8,
          ease: "back.out(1.7)",
        });
      }

      // 2. Horizontal Scroll Setup
      const getScrollAmount = () => -(scrollContainer.scrollWidth - window.innerWidth);
      
      const horizontalTween = gsap.to(scrollContainer, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${scrollContainer.scrollWidth - window.innerWidth}`, // Scroll distance exactly matches horizontal travel
          pin: true,
          scrub: 1, // smooth scrubbing
          invalidateOnRefresh: true, // Recalculate values on resize
          onUpdate: (self) => {
            const weight = 400 + (self.progress * 400);
            heading.style.fontVariationSettings = `"wght" ${weight}`;
            
            if (progressLineRef.current && icon) {
                const maxMovement = progressLineRef.current.offsetWidth - icon.offsetWidth;
                gsap.set(icon, { x: self.progress * maxMovement });
            }
          }
        },
      });

      // 3. Animate Individual Cards as they enter the horizontal view
      const cards = gsap.utils.toArray<HTMLElement>(".feature-card");
      
      cards.forEach((card) => {
        if (isReduced) {
          gsap.set(card, { opacity: 1 });
          return;
        }

        const cardTitle = card.querySelector(".card-title") as HTMLElement;
        const cardDesc = card.querySelector(".card-desc") as HTMLElement;
        
        if (cardTitle) {
           const splitTitle = new SplitType(cardTitle, { types: "words" });
           gsap.from(splitTitle.words, {
             opacity: 0,
             y: 40,
             rotationX: -40,
             stagger: 0.05,
             duration: 0.8,
             ease: "back.out(1.5)",
             scrollTrigger: {
               trigger: card,
               containerAnimation: horizontalTween,
               start: "left 80%", // Trigger slightly earlier
               toggleActions: "play none none reverse",
             }
           });
        }

        if (cardDesc) {
            const splitDesc = new SplitType(cardDesc, { types: "lines" });
            gsap.from(splitDesc.lines, {
                opacity: 0,
                y: 30,
                stagger: 0.1,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: card,
                  containerAnimation: horizontalTween,
                  start: "left 80%",
                  toggleActions: "play none none reverse",
                }
            });
        }
      });
    });

    // Mobile Animation (Vertical Fade In)
    mm.add("(max-width: 767px)", () => {
      const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!isReduced) {
        const cards = gsap.utils.toArray<HTMLElement>(".feature-card");
        cards.forEach((card) => {
          gsap.from(card, {
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
            y: 30,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
          });
        });
      }
    });

    return () => {
        mm.revert(); // Cleanup matchMedia
    };
  }, []);

  return (
    <section 
        ref={sectionRef} 
        id="about" 
        className="relative overflow-hidden bg-background min-h-screen md:h-screen flex flex-col justify-center py-20 md:py-0"
    >
      {/* Neo-brutalist pattern background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)", backgroundSize: "32px 32px" }}>
      </div>

      <div className="md:absolute md:top-20 left-0 w-full px-6 md:px-16 z-10 mb-8 md:mb-0">
        <h2 
            ref={headingRef}
            className="text-5xl md:text-7xl font-extrabold uppercase mb-2 md:mb-4"
            style={{ 
                fontFamily: "var(--font-space-grotesk)",
                fontVariationSettings: '"wght" 400',
                transition: "font-variation-settings 0.1s ease"
            }}
        >
          {t("about.title")}
        </h2>
      </div>

      {/* Container - Stacked vertically on mobile, horizontal scroll on desktop */}
      <div ref={scrollContainerRef} className="flex flex-col md:flex-row h-full md:items-center px-6 md:pl-16 md:pr-[15vw] w-full md:w-max">
        <div className="flex flex-col md:flex-row gap-6 md:gap-16 md:mt-12 md:mb-8 flex-nowrap w-full">
          {featureData.map((feature, idx) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.key}
                className={`feature-card group w-full md:w-[450px] shrink-0 border-4 border-foreground relative overflow-hidden flex flex-col justify-between p-5 md:p-8 transition-transform duration-300 hover:-translate-y-2`}
                style={{
                  backgroundColor: `var(--${feature.color})`,
                  color: feature.color === "foreground" ? "var(--background)" : `var(--${feature.color}-foreground)`,
                  boxShadow: `12px 12px 0px 0px var(--foreground)`
                }}
              >
                {/* Giant watermark number */}
                <div className="absolute -bottom-4 md:-bottom-8 -right-2 md:-right-4 text-[120px] md:text-[200px] font-black opacity-10 pointer-events-none mix-blend-overlay leading-none select-none">
                  0{idx + 1}
                </div>

                {/* Top: Icon + Label */}
                <div className="flex justify-between items-start mb-8 md:mb-16 relative z-10">
                   <div className="bg-background border-[3px] md:border-4 border-foreground p-2 md:p-3 shadow-[4px_4px_0px_0px_var(--foreground)] group-hover:rotate-6 transition-transform duration-300">
                     <Icon className="w-6 h-6 md:w-10 md:h-10 text-foreground" />
                   </div>
                   <div className="px-2 md:px-3 py-1 bg-foreground text-background text-[10px] md:text-xs font-black uppercase tracking-widest border-2 border-foreground shadow-[2px_2px_0px_0px_var(--foreground)]">
                     LDV // 0{idx + 1}
                   </div>
                </div>
                
                {/* Bottom: Text Content Block */}
                <div className="relative z-10 bg-background/95 p-4 md:p-6 border-[3px] md:border-4 border-foreground shadow-[4px_4px_0px_0px_var(--foreground)] md:shadow-[6px_6px_0px_0px_var(--foreground)] group-hover:-translate-y-1 transition-transform duration-300">
                    <h3
                        className="card-title font-black text-xl md:text-3xl mb-2 md:mb-3 text-foreground uppercase tracking-tight"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                    {t(`about.features.${feature.key}.title`)}
                    </h3>
                    
                    <p className="card-desc text-foreground/80 text-sm md:text-base leading-relaxed font-bold">
                    {t(`about.features.${feature.key}.description`)}
                    </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll Progress Tracker (Desktop Only) */}
      <div className="hidden md:flex absolute bottom-8 left-16 right-16 h-12 items-center">
         <div ref={progressLineRef} className="w-full h-2 bg-muted rounded-full neo-border relative overflow-visible">
            <div 
                ref={iconRef}
                className="absolute top-1/2 -translate-y-1/2 left-0 w-10 h-10 bg-primary rounded-xl neo-border flex items-center justify-center z-10 text-primary-foreground neo-shadow-sm"
            >
                <Rocket className="w-5 h-5 rotate-90" />
            </div>
         </div>
      </div>
    </section>
  );
}
