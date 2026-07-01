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

    let ctx = gsap.context(() => {
      // 1. Split Text Animation for Heading
      const text = new SplitType(heading, { types: "chars,words" });
      
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

      // 2. Horizontal Scroll Setup
      // Calculate how far to scroll based on the total width of the container minus viewport width
      const getScrollAmount = () => -(scrollContainer.scrollWidth - window.innerWidth);
      
      const horizontalTween = gsap.to(scrollContainer, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${scrollContainer.scrollWidth}`, // scroll distance equals total width
          pin: true,
          scrub: 1, // smooth scrubbing
          invalidateOnRefresh: true, // Recalculate values on resize
          onUpdate: (self) => {
            // Variable Font Animation based on global horizontal progress
            // Interpolate font weight between 400 and 800 based on progress
            const weight = 400 + (self.progress * 400);
            heading.style.fontVariationSettings = `"wght" ${weight}`;
            
            // Icon Movement along progress line
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
        // We use containerAnimation to trigger animations based on the horizontal tween!
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
    }, sectionRef); // Scope to the section

    return () => {
        ctx.revert(); // Cleanup GSAP animations and ScrollTrigger
    };
  }, []);

  return (
    <section 
        ref={sectionRef} 
        id="about" 
        className="relative overflow-hidden bg-background h-screen flex flex-col justify-center"
    >
      {/* Neo-brutalist pattern background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)", backgroundSize: "32px 32px" }}>
      </div>

      <div className="absolute top-10 md:top-20 left-0 w-full px-8 md:px-16 z-10">
        <h2 
            ref={headingRef}
            className="text-5xl md:text-7xl font-extrabold uppercase mb-4"
            style={{ 
                fontFamily: "var(--font-space-grotesk)",
                fontVariationSettings: '"wght" 400',
                transition: "font-variation-settings 0.1s ease"
            }}
        >
          {t("about.title")}
        </h2>
      </div>

      {/* Horizontal Scroll Container */}
      <div ref={scrollContainerRef} className="flex h-full items-center pl-8 md:pl-16 pr-[15vw] flex-nowrap w-max">
        <div className="flex gap-8 md:gap-16 mt-20 flex-nowrap">
          {featureData.map((feature) => {
            const Icon = feature.icon;
            const borderClass =
              feature.color === "primary"
                ? "neo-border-primary"
                : feature.color === "secondary"
                ? "neo-border-secondary"
                : "neo-border";
            
            const shadowClass =
              feature.color === "primary"
                ? "neo-shadow-primary"
                : feature.color === "secondary"
                ? "neo-shadow-secondary"
                : "neo-shadow";

            return (
              <div
                key={feature.key}
                className={`feature-card w-[80vw] md:w-[450px] shrink-0 ${borderClass} ${shadowClass} rounded-3xl p-10 bg-card flex flex-col justify-between`}
              >
                <div
                  className="w-20 h-20 rounded-2xl mb-12 flex items-center justify-center neo-border"
                  style={{
                    backgroundColor: `var(--${feature.color})`,
                    color: feature.color === "foreground" ? "var(--background)" : `var(--${feature.color}-foreground)`,
                  }}
                >
                  <Icon className="w-10 h-10" />
                </div>
                
                <div>
                    <h3
                        className="card-title font-black text-3xl mb-4 text-foreground uppercase tracking-tight"
                        style={{ fontFamily: "var(--font-space-grotesk)" }}
                    >
                    {t(`about.features.${feature.key}.title`)}
                    </h3>
                    
                    <p className="card-desc text-muted-foreground text-lg leading-relaxed font-medium">
                    {t(`about.features.${feature.key}.description`)}
                    </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll Progress Tracker */}
      <div className="absolute bottom-10 left-8 md:left-16 right-8 md:right-16 h-12 flex items-center">
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
