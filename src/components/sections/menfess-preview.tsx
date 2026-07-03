"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Container, Section } from "@/components/layout";
import { SectionHeading } from "@/components/shared";
import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";

type Menfess = {
  id: string;
  content: string;
  sender_name: string;
  is_anonymous: boolean;
  avatar_color: string;
  created_at: string;
  menfess_comments: { id: string }[];
};

function getAvatarStyle(color: string) {
  const isLight = color === "secondary" || color === "warning" || color === "pink" || color === "accent";
  return {
    backgroundColor: `var(--${color})`,
    color: isLight ? "var(--foreground)" : "var(--background)",
  };
}

export function MenfessPreview() {
  const [posts, setPosts] = useState<Menfess[]>([]);
  const supabase = createClient();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("menfess")
        .select("*, menfess_comments(id)")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (data) {
        // Sort by highest number of comments
        const sortedData = [...data].sort(
          (a, b) => (b.menfess_comments?.length || 0) - (a.menfess_comments?.length || 0)
        );
        // Take the top 3 most commented posts
        setPosts(sortedData.slice(0, 3));
      }
    };
    fetchPosts();
  }, []);

  return (
    <Section id="menfess" className="bg-background pb-12 pt-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <SectionHeading
          title="Secret Board"
          subtitle="Top secret messages from the community. Drop yours anonymously."
          className="mb-0 text-left max-w-2xl"
        />
        <Link
          href="/menfess"
          className="hidden md:inline-flex items-center gap-2 px-6 py-3 font-bold text-primary-foreground bg-primary neo-border neo-shadow-sm neo-hover rounded-xl shrink-0"
        >
          Go to Secret Board
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {posts.length === 0 ? (
          <div className="col-span-3 neo-border rounded-2xl p-12 bg-card text-center text-muted-foreground border-dashed">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-bold">No secrets yet</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                delay: i * 0.15
              }}
              className="bg-card neo-border neo-shadow rounded-2xl p-6 flex flex-col gap-4 group"
              style={{
                // Add the subtle float animation via style or class
                animation: `float 6s ease-in-out ${i * 1.5}s infinite`
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2 border-[var(--foreground)]"
                  style={getAvatarStyle(post.avatar_color)}
                >
                  {post.is_anonymous ? "?" : post.sender_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-foreground">
                    {post.is_anonymous ? "Anonymous" : post.sender_name}
                  </p>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <p className="text-foreground leading-relaxed whitespace-pre-wrap line-clamp-4 flex-1">
                {post.content}
              </p>

              <div className="mt-2 pt-4 border-t-2 border-[var(--border)] flex justify-between items-center text-muted-foreground font-semibold text-sm">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.menfess_comments?.length || 0} Comments</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-12 text-center md:hidden">
        <Link
          href="/menfess"
          className="inline-flex items-center gap-2 px-6 py-3 font-bold text-primary-foreground bg-primary neo-border neo-shadow-sm neo-press rounded-xl"
        >
          Go to Secret Board
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </Section>
  );
}
