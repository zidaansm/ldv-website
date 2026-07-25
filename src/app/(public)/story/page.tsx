"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

type StorySection = {
  id: string;
  title: string;
  content: string;
  order_index: number;
};

export default function StoryPage() {
  const [sections, setSections] = useState<StorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const { data, error } = await supabase
          .from("story_sections")
          .select("*")
          .eq("is_active", true)
          .order("order_index", { ascending: true });
        
        if (!error && data) {
          setSections(data);
        }
      } catch (error) {
        console.error("Failed to fetch stories", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [supabase]);

  // Generate alternating neo-brutalist styles for the sections
  const getSectionStyle = (index: number) => {
    const styles = [
      { bg: "bg-primary text-primary-foreground", shadow: "neo-shadow-pink", border: "border-neo-border" },
      { bg: "bg-secondary text-secondary-foreground", shadow: "neo-shadow-primary", border: "border-neo-border" },
      { bg: "bg-card text-foreground", shadow: "neo-shadow-secondary", border: "border-neo-border" },
      { bg: "bg-purple text-primary-foreground", shadow: "neo-shadow-pink", border: "border-neo-border" }
    ];
    return styles[index % styles.length];
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-20 overflow-hidden relative">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-secondary/10 blur-3xl -z-10" />
      
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center mb-16 md:mb-24"
        >
          <div className="inline-block bg-secondary text-secondary-foreground font-black uppercase tracking-widest px-4 py-1 border-2 border-black rounded-full text-sm mb-6 shadow-[2px_2px_0_0_black]">
            Our Story
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase leading-[0.9]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            The <span className="text-primary">Manifesto</span>
          </h1>
          <p className="text-xl md:text-2xl font-bold mt-8 max-w-2xl mx-auto text-muted-foreground">
            Dari eksperimen menjadi komunitas. Inilah cerita perjalanan, filosofi, dan nilai-nilai yang kami hidupi di La Dolce Vita.
          </p>
        </motion.div>

        {/* Content Sections */}
        {loading ? (
          <div className="flex flex-col gap-12 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-card border-4 border-black h-64 rounded-2xl neo-shadow" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold">Kisah ini masih ditulis...</h2>
            <p className="text-muted-foreground mt-2">Belum ada bagian cerita yang dipublikasikan.</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-16 md:space-y-24">
            {sections.map((section, index) => {
              const style = getSectionStyle(index);
              // Alternate alignment: even index on left, odd on right (for desktop)
              const isEven = index % 2 === 0;
              
              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 100, rotate: isEven ? -2 : 2 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                  className={`relative ${isEven ? 'md:pr-12' : 'md:pl-12'} group`}
                >
                  <div className={`p-8 md:p-12 border-4 ${style.border} rounded-3xl ${style.bg} ${style.shadow} transition-transform duration-300 group-hover:-translate-y-2`}>
                    
                    {/* Number Badge */}
                    <div className={`absolute -top-6 ${isEven ? '-left-6' : '-right-6'} w-16 h-16 bg-background border-4 border-black rounded-xl flex items-center justify-center text-3xl font-black shadow-[4px_4px_0_0_black] z-10 text-foreground`}>
                      {index + 1}
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase leading-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      {section.title}
                    </h2>
                    
                    <div className="prose prose-lg md:prose-xl max-w-none prose-headings:font-black prose-p:font-medium leading-relaxed dark:prose-invert">
                      {/* Forcing custom styling on the markdown elements to ensure high contrast in colored boxes */}
                      <div className={`
                        ${style.bg.includes('primary') || style.bg.includes('purple') ? 'text-primary-foreground prose-headings:text-primary-foreground prose-strong:text-primary-foreground' : ''}
                        ${style.bg.includes('secondary') ? 'text-secondary-foreground prose-headings:text-secondary-foreground prose-strong:text-secondary-foreground' : ''}
                        ${style.bg.includes('card') ? 'text-foreground prose-headings:text-foreground prose-strong:text-foreground' : ''}
                      `}>
                        <ReactMarkdown>
                          {section.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
