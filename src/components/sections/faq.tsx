"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { Section } from "@/components/layout";
import { SectionHeading } from "@/components/shared";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function FAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [faqItems, setFaqItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFaqs() {
      try {
        const { data } = await supabase.from("faq").select("*").order("created_at", { ascending: true });
        if (data) setFaqItems(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchFaqs();
  }, []);

  return (
    <Section id="faq" withPattern={false} className="bg-[var(--muted)]/50">
      <div className="max-w-4xl mx-auto space-y-16">
        <SectionHeading
          title={t("faq.title")}
          subtitle={t("faq.subtitle")}
          accentColor="purple"
        />

        <motion.div
          className="space-y-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 neo-border rounded-xl bg-muted animate-pulse" />
              ))}
            </>
          ) : faqItems.length === 0 ? (
            <div className="text-center py-12 neo-border rounded-2xl bg-card border-dashed">
              <p className="text-muted-foreground font-bold text-lg">
                No FAQ available at the moment.
              </p>
            </div>
          ) : (
            faqItems.map((faq, idx) => {
              const isOpen = openIndex === idx;

            return (
              <motion.div
                key={faq.id}
                variants={fadeInUp}
                className={cn(
                  "neo-border rounded-xl bg-card overflow-hidden transition-all duration-300",
                  isOpen ? "neo-shadow-primary" : "neo-hover"
                )}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span
                    className="font-bold text-lg text-foreground pr-4"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {faq.question}
                  </span>
                  <div
                    className={cn(
                      "w-8 h-8 shrink-0 rounded-lg neo-border flex items-center justify-center transition-colors",
                      isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}
                  >
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-2 text-muted-foreground leading-relaxed border-t-[2px] border-[var(--border)] mt-2">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </Section>
  );
}
