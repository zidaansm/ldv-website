"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Container } from "@/components/layout";
import { SectionHeading } from "@/components/shared";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { Users, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type Member = {
  id: string;
  name: string;
  motto: string;
  avatar_url: string;
  accent_color: string;
};

const ITEMS_PER_PAGE = 12;

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    fetchMembers(page);
  }, [page]);

  const fetchMembers = async (pageNumber: number) => {
    setLoading(true);
    
    // Get total count
    const { count } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true });
      
    if (count !== null) setTotalCount(count);

    // Get paginated data
    const from = (pageNumber - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);
    
    if (data) setMembers(data);
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="pt-32 pb-24 min-h-screen bg-background">
      <Container>
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground hover:text-foreground neo-border rounded-xl mb-8 font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <SectionHeading
            title="Our Members"
            subtitle="Meet the amazing people that make up the La Dolce Vita community."
            className="mb-0 max-w-3xl"
            accentColor="cyan"
          />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-card neo-border rounded-3xl h-[280px] w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
             <div className="neo-border rounded-3xl p-24 bg-card text-center flex flex-col items-center justify-center text-muted-foreground">
              <Users className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-bold text-xl">No members found.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                {members.map((member, blockIdx) => {
                  const colorMap: Record<string, string> = {
                    purple: "#6b2157",
                    pink: "#db2777",
                    cyan: "#0891b2",
                    danger: "#e53e3e",
                    success: "#38a169",
                    warning: "#d69e2e",
                  };
                  const color = colorMap[member.accent_color] || colorMap.purple;

                  return (
                    <motion.div
                      key={member.id}
                      variants={fadeInUp}
                      className="w-full max-w-[280px] shrink-0 rounded-3xl p-6 bg-card flex flex-col items-center text-center cursor-pointer"
                      style={{
                        border: `3px solid ${color}`,
                        boxShadow: `4px 4px 0 ${color}`,
                      }}
                      whileHover={{
                        x: -4,
                        y: -4,
                        boxShadow: "10px 10px 0 0 var(--neo-border)",
                      }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {/* Roblox Avatar from Supabase */}
                      <div className="w-40 h-40 mb-6 flex items-center justify-center relative drop-shadow-lg">
                        <img
                          src={member.avatar_url}
                          alt={`${member.name} Roblox Avatar`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          draggable="false"
                        />
                      </div>

                      <div className="space-y-1">
                        <h3
                          className="font-bold text-xl text-foreground break-all line-clamp-1"
                          style={{ fontFamily: "var(--font-space-grotesk)" }}
                        >
                          {member.name}
                        </h3>
                        <p className="text-sm font-semibold italic text-muted-foreground line-clamp-2">
                          "{member.motto}"
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-16">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-3 rounded-xl neo-border bg-card text-foreground disabled:opacity-50 hover:bg-muted neo-press transition-colors disabled:neo-hover-none disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="font-bold text-lg" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-3 rounded-xl neo-border bg-card text-foreground disabled:opacity-50 hover:bg-muted neo-press transition-colors disabled:neo-hover-none disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </Container>
    </div>
  );
}
