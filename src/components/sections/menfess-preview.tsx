"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { Container, Section } from "@/components/layout";
import { SectionHeading } from "@/components/shared/section-heading";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquare, Heart } from "lucide-react";

type Menfess = {
  id: string;
  content: string;
  sender_name: string;
  is_anonymous: boolean;
  avatar_color: string;
  created_at: string;
  menfess_comments: { id: string }[];
  menfess_likes?: { id: string }[];
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
  const [memberAvatars, setMemberAvatars] = useState<string[]>([]);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const supabase = createClient();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const fetchPostsAndAvatars = async () => {
      const [postsRes, membersRes] = await Promise.all([
        supabase
          .from("menfess")
          .select("*, menfess_comments(id), menfess_likes(id)")
          .eq("is_approved", true)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("members")
          .select("avatar_url")
      ]);

      const { data, error } = postsRes;
      
      if (error) {
        console.error("Supabase Error Menfess:", error);
        setErrorMsg(error.message);
        
        // Auto-fix expired JWT by clearing session
        if (error.message.includes("JWT") || error.code === "PGRST301") {
          await supabase.auth.signOut();
          window.location.reload();
        }
      }
      
      if (data) {
        // Sort by (likes + comments)
        const sortedData = [...data].sort(
          (a, b) => {
            const scoreA = (a.menfess_comments?.length || 0) + (a.menfess_likes?.length || 0);
            const scoreB = (b.menfess_comments?.length || 0) + (b.menfess_likes?.length || 0);
            return scoreB - scoreA;
          }
        );
        // Take the top 3 most commented posts
        setPosts(sortedData.slice(0, 3));
      }
      if (membersRes.data) {
        setMemberAvatars(membersRes.data.map(m => m.avatar_url).filter(Boolean));
      }
      setIsLoading(false);
    };
    
    fetchPostsAndAvatars();

    // Read likes from localStorage
    const likes: Record<string, boolean> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('liked_menfess_')) {
        const postId = key.replace('liked_menfess_', '');
        likes[postId] = true;
      }
    }
    setLikedPosts(likes);
  }, []);

  const [sessionSalt, setSessionSalt] = useState(0);

  useEffect(() => {
    setSessionSalt(Math.floor(Math.random() * 10000));
  }, []);

  const getPostAvatars = (postId: string) => {
    if (memberAvatars.length === 0) return [];
    let hash = sessionSalt;
    for (let i = 0; i < postId.length; i++) {
      hash = (hash << 5) - hash + postId.charCodeAt(i);
      hash |= 0;
    }
    hash = Math.abs(hash);
    
    const count = 5; // 5 avatars per card
    const selected = [];
    const pool = [...memberAvatars];
    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = (hash + i * 17) % pool.length;
      selected.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return selected;
  };

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
        {errorMsg && (
          <div className="col-span-3 neo-border rounded-2xl p-12 bg-danger/10 text-center text-danger border-dashed">
            <p className="font-bold">Error: {errorMsg}</p>
          </div>
        )}
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted animate-pulse neo-border neo-shadow rounded-2xl h-48" />
            ))}
          </>
        ) : posts.length === 0 ? (
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
              className="mt-12"
              onClick={() => router.push(`/menfess?post=${post.id}`)}
              style={{
                animation: `float 6s ease-in-out ${i * 1.5}s infinite`
              }}
            >
              <div className="relative isolate transition-transform h-full hover:scale-[1.02] cursor-pointer group">
                
                {/* Decorative Static Avatars */}
                {getPostAvatars(post.id).map((avatarUrl, idx) => {
                  const configs = [
                    { left: "10%", top: "-4rem", rotate: "-5deg" },
                    { left: "30%", top: "-5rem", rotate: "4deg" },
                    { left: "50%", top: "-4.5rem", rotate: "-2deg" },
                    { left: "70%", top: "-5.2rem", rotate: "6deg" },
                    { left: "90%", top: "-4.2rem", rotate: "-4deg" }
                  ];
                  const config = configs[idx];
                  return (
                    <div
                      key={idx}
                      className="absolute w-36 h-36 -z-10 pointer-events-none opacity-100"
                      style={{ 
                        left: config.left,
                        top: config.top,
                        transform: `translateX(-50%) rotate(${config.rotate})`
                      }}
                    >
                      <img
                        src={avatarUrl}
                        alt="Decorative Avatar"
                        className="w-full h-full object-cover"
                        style={{ 
                          objectPosition: "center top",
                          filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))' 
                        }}
                        crossOrigin="anonymous"
                      />
                    </div>
                  );
                })}

                <div className="relative z-10 bg-card neo-border neo-shadow rounded-2xl p-6 flex flex-col gap-4 h-full">
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
                <div className="flex gap-4">
                  <div className={`flex items-center gap-1.5 transition-colors ${likedPosts[post.id] ? 'text-danger' : 'group-hover:text-danger'}`}>
                    <Heart className={`w-4 h-4 ${likedPosts[post.id] ? 'fill-current' : ''}`} />
                    <span>{post.menfess_likes?.length || 0} Likes</span>
                  </div>
                  <div className="flex items-center gap-1.5 group-hover:text-primary transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.menfess_comments?.length || 0} Comments</span>
                  </div>
                </div>
              </div>
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
