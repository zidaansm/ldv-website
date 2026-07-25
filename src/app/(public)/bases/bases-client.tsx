"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Send, ChevronRight, X, Loader2 } from "lucide-react";
import { playClick } from "@/lib/sounds";
import Image from "@/components/ui/smart-image";
import ReactMarkdown from "react-markdown";

type TwitterBase = {
  id: string;
  handle: string;
  name: string;
  description: string;
  rules: string;
  logo_url: string;
  submit_link: string;
  created_at: string;
};

function BaseCard({ base, index, onOpenRules }: { base: TwitterBase; index: number, onOpenRules: () => void }) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="break-inside-avoid bg-card neo-border neo-shadow-sm rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden"
    >
      <div className="flex items-center gap-4 border-b-2 border-black pb-4">
        {base.logo_url ? (
          <div className="w-16 h-16 rounded-full border-2 border-black overflow-hidden bg-white shrink-0 relative">
            <Image
              src={base.logo_url}
              alt={base.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full border-2 border-black bg-primary flex items-center justify-center shrink-0">
            <Hash className="w-8 h-8 text-primary-foreground" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-extrabold text-xl text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            {base.name}
          </h3>
          <p className="text-sm font-bold text-muted-foreground">{base.handle}</p>
        </div>
      </div>

      <div className="flex-1">
        <p className="text-foreground leading-relaxed">
          {base.description || "No description provided."}
        </p>
      </div>

      {base.rules && (
        <div className="mt-2">
          <button
            onClick={() => {
              playClick();
              onOpenRules();
            }}
            className="w-full flex items-center justify-between p-3 neo-border rounded-xl bg-muted hover:bg-secondary transition-colors text-sm font-bold neo-press"
          >
            <span>Read Rules</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mt-4 pt-4 border-t-2 border-black">
        <a
          href={base.submit_link || "#"}
          target={base.submit_link ? "_blank" : "_self"}
          rel="noopener noreferrer"
          onClick={() => playClick()}
          className="w-full py-3 bg-primary text-primary-foreground font-bold text-base neo-border neo-press rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Send className="w-4 h-4" />
          Send Menfess
        </a>
      </div>
    </motion.div>
  );
}

export function BasesClient({ initialBases }: { initialBases: TwitterBase[] }) {
  const [bases, setBases] = useState<TwitterBase[]>(initialBases);
  const [loading, setLoading] = useState(false);
  const [selectedBase, setSelectedBase] = useState<TwitterBase | null>(null);

  useEffect(() => {
    if (bases.length > 0 && bases === initialBases) return;
    async function fetchBases() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("twitter_bases")
        .select("*")
        .order("created_at", { ascending: true });
        
      if (!error && data) {
        setBases(data);
      }
      setLoading(false);
    }
    
    fetchBases();
  }, [bases, initialBases]);

  return (
    <div className="pt-32 pb-24 min-h-screen bg-[var(--background)] relative">
      <Container className="relative z-10">
        <div className="mb-12">
          <SectionHeading
            title="Twitter Bases"
            subtitle="Connect with our community through our official Twitter autofess bases. Read the rules and drop your menfess."
            className="mb-0 text-left max-w-2xl"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card neo-border rounded-2xl h-[400px] w-full" />
            ))}
          </div>
        ) : bases.length === 0 ? (
          <div className="neo-border rounded-2xl p-24 bg-card text-center flex flex-col items-center justify-center text-muted-foreground">
            <Hash className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-bold text-xl">No bases found</p>
            <p className="text-sm mt-2">There are currently no active Twitter bases.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bases.map((base, index) => (
              <BaseCard key={base.id} base={base} index={index} onOpenRules={() => setSelectedBase(base)} />
            ))}
          </div>
        )}
      </Container>

      {/* Rules Modal */}
      <AnimatePresence>
        {selectedBase && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                playClick();
                setSelectedBase(null);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card neo-border neo-shadow-sm rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col relative z-10"
            >
              <div className="flex items-center justify-between p-6 border-b-2 border-black">
                <div>
                  <h3 className="font-extrabold text-xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    {selectedBase.name} Rules
                  </h3>
                  <p className="text-sm font-bold text-muted-foreground">{selectedBase.handle}</p>
                </div>
                <button
                  onClick={() => {
                    playClick();
                    setSelectedBase(null);
                  }}
                  className="p-2 bg-muted hover:bg-secondary neo-border neo-press rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-2xl font-extrabold mb-4 mt-6 first:mt-0" style={{ fontFamily: "var(--font-space-grotesk)" }} {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-extrabold mb-3 mt-6 first:mt-0" style={{ fontFamily: "var(--font-space-grotesk)" }} {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2 mt-4 first:mt-0" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 leading-relaxed font-medium" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1 font-medium" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1 font-medium" {...props} />,
                      li: ({node, ...props}) => <li className="" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-extrabold text-foreground" {...props} />,
                      a: ({node, ...props}) => <a className="text-primary hover:underline font-bold" target="_blank" rel="noopener noreferrer" {...props} />
                    }}
                  >
                    {selectedBase.rules}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="p-6 border-t-2 border-black bg-muted/30 rounded-b-2xl">
                <a
                  href={selectedBase.submit_link || "#"}
                  target={selectedBase.submit_link ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  onClick={() => playClick()}
                  className="w-full py-3 bg-primary text-primary-foreground font-bold text-base neo-border neo-press rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  I Agree, Send Menfess
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
