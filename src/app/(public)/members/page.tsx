"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/layout";
import { SectionHeading } from "@/components/shared";
import { Users, ArrowLeft, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import Link from "next/link";

type Member = {
  id: string;
  name: string;
  motto: string;
  avatar_url: string;
  accent_color: string;
};

const ITEMS_PER_PAGE = 12;

const colorMap: Record<string, string> = {
  purple: "#6b2157",
  pink: "#db2777",
  cyan: "#0891b2",
  danger: "#e53e3e",
  success: "#38a169",
  warning: "#d69e2e",
  "neo-red": "#FF2B2B",
  "neo-yellow": "#FFD600",
  "neo-blue": "#0047FF",
  "neo-purple": "#7B00FF",
  "neo-pink": "#FF006E",
  "neo-orange": "#FF5C00",
  "neo-green": "#00C44F",
  "neo-dark": "#1A1A2E",
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const supabase = createClient();

  // Debounce the search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Reset to page 1 on new search
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  useEffect(() => {
    fetchMembers(page, debouncedQuery);
  }, [page, debouncedQuery]);

  const fetchMembers = async (pageNumber: number, search: string) => {
    setLoading(true);

    let countQuery = supabase.from("members").select("*", { count: "exact", head: true });
    let dataQuery = supabase.from("members").select("*").order("created_at", { ascending: false });

    if (search.trim()) {
      countQuery = countQuery.ilike("name", `%${search.trim()}%`);
      dataQuery = dataQuery.ilike("name", `%${search.trim()}%`);
    }

    const { count } = await countQuery;
    if (count !== null) setTotalCount(count);

    const from = (pageNumber - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    const { data } = await dataQuery.range(from, to);

    if (data) setMembers(data);
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const isSearching = debouncedQuery.trim().length > 0;

  return (
    <div className="pt-32 pb-24 min-h-screen bg-background">
      <Container>
        <div className="mb-10">
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

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username..."
              className="w-full pl-12 pr-10 py-3 neo-border rounded-2xl bg-card font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <AnimatePresence>
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Result count */}
          <AnimatePresence mode="wait">
            {isSearching && !loading && (
              <motion.p
                key={debouncedQuery}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 text-sm text-muted-foreground font-semibold"
              >
                {totalCount > 0
                  ? <>Found <span className="text-foreground font-bold">{totalCount}</span> member{totalCount !== 1 ? "s" : ""} matching &quot;<span className="text-primary">{debouncedQuery}</span>&quot;</>
                  : <>No members found for &quot;<span className="text-primary">{debouncedQuery}</span>&quot;</>}
              </motion.p>
            )}
            {!isSearching && !loading && (
              <motion.p
                key="total"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-sm text-muted-foreground font-semibold"
              >
                <span className="text-foreground font-bold">{totalCount}</span> members total
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-card neo-border rounded-3xl h-[280px] w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="neo-border rounded-3xl p-24 bg-card text-center flex flex-col items-center justify-center text-muted-foreground">
              <Users className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-bold text-xl">
                {isSearching ? "No members found." : "No members yet."}
              </p>
              {isSearching && (
                <button onClick={() => setQuery("")} className="mt-4 px-4 py-2 text-sm font-bold neo-border rounded-xl bg-card hover:bg-muted transition-colors">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <motion.div
                key={`${debouncedQuery}-${page}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center"
              >
                  {members.map((member) => {
                    const color = colorMap[member.accent_color] || colorMap.purple;
                    return (
                      <motion.div
                        key={member.id}
                        className="w-full max-w-[280px] shrink-0 rounded-3xl p-6 bg-card flex flex-col items-center text-center cursor-pointer"
                        style={{ border: `3px solid ${color}`, boxShadow: `4px 4px 0 ${color}` }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.05 * (members.indexOf(member) % 8) }}
                        whileHover={{ x: -4, y: -4, boxShadow: "10px 10px 0 0 var(--neo-border)" }}
                      >
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
                            &quot;{member.motto}&quot;
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-16">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-3 rounded-xl neo-border bg-card text-foreground disabled:opacity-50 hover:bg-muted neo-press transition-colors disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="font-bold text-lg" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-3 rounded-xl neo-border bg-card text-foreground disabled:opacity-50 hover:bg-muted neo-press transition-colors disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
