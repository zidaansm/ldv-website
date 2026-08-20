"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Handshake, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Collaboration = {
  id: string;
  title: string;
  icon: string;
  description: string;
  order_index: number;
};

export default function CollaborationPage() {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchCollaborations = async () => {
      try {
        const { data, error } = await supabase
          .from("collaborations")
          .select("*")
          .order("order_index", { ascending: true });

        if (!error && data) {
          setCollaborations(data);
          if (data.length > 0) {
            setExpandedIds([data[0].id]); // Expand the first one by default
          }
        }
      } catch (error) {
        console.error("Error fetching collaborations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollaborations();
  }, [supabase]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="inline-block bg-primary neo-border rounded-2xl p-4 neo-shadow-sm mb-2"
          >
            <Handshake className="w-12 h-12 text-primary-foreground" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tight"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            La Dolce Vita <br />
            <span className="text-primary">Collaboration Program</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl font-bold max-w-2xl mx-auto neo-border bg-white rounded-xl py-3 px-6 transform -rotate-1"
          >
            Connecting Communities, Creators, and Brands
          </motion.p>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="mt-4 font-bold text-lg">Loading programs...</p>
          </div>
        ) : collaborations.length === 0 ? (
          <div className="bg-card neo-border rounded-2xl p-12 text-center">
            <h3 className="text-2xl font-bold">No programs available yet.</h3>
            <p className="text-muted-foreground mt-2 font-medium">Check back later!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {collaborations.map((collab, index) => {
              const isExpanded = expandedIds.includes(collab.id);
              
              return (
                <motion.div
                  key={collab.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`bg-card neo-border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'neo-shadow-lg scale-[1.01]' : 'neo-shadow hover:translate-x-1 hover:-translate-y-1'}`}
                >
                  <button
                    onClick={() => toggleExpand(collab.id)}
                    className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex-shrink-0 bg-background neo-border rounded-xl flex items-center justify-center text-2xl">
                        {collab.icon}
                      </div>
                      <h2 className="text-xl md:text-2xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                        {collab.title}
                      </h2>
                    </div>
                    <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-5 md:px-6 pb-6 pt-2 border-t-2 border-black/10">
                          <div className="prose prose-lg dark:prose-invert max-w-none text-foreground prose-headings:font-black prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-a:text-primary prose-a:font-bold prose-a:underline prose-p:font-medium">
                            <ReactMarkdown>
                              {collab.description || "_No description provided._"}
                            </ReactMarkdown>
                          </div>
                          
                          <div className="mt-8 pt-6 border-t-2 border-black/10">
                            <a
                              href="mailto:contact@ldv.gg"
                              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black uppercase tracking-wider neo-border neo-press rounded-xl w-full sm:w-auto"
                            >
                              Inquire Now
                            </a>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
