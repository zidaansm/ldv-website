"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/layout";
import { fadeInUp } from "@/lib/animations";
import Image from "next/image";

const partners = [
  {
    name: "Lubox",
    logo: "/partners/lubox.png",
    url: "https://luboxofficial.com/"
  }
];

export function Partners() {
  return (
    <section className="pt-24 pb-16 bg-muted/30 border-y-2 border-[var(--border)] mt-8">
      <Container>
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-col items-center justify-center gap-8"
        >
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Supported By
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {partners.map((partner, idx) => (
              <a
                key={idx}
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center justify-center p-4 bg-[#800000] neo-border neo-shadow-sm neo-hover rounded-2xl h-24 md:h-28 w-48 md:w-56 transition-transform hover:scale-105"
              >
                <img
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  className="w-full h-full object-contain transition-all duration-300"
                  onError={(e) => (e.currentTarget.src = "https://placehold.co/400x200/png?text=Lubox")}
                />
              </a>
            ))}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
