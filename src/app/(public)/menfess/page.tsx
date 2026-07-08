"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Plus, X, Loader2, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Suspense } from "react";
import { playClick, playPop } from "@/lib/sounds";

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

type Comment = {
  id: string;
  content: string;
  sender_name: string;
  is_anonymous: boolean;
  avatar_color: string;
  created_at: string;
};

// Available colors for random avatar
const COLORS = ["primary", "secondary", "danger", "warning", "success", "purple", "pink", "cyan"];

function getRandomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function getAvatarStyle(color: string) {
  // If the color is a light shade, use dark text. Otherwise use light text.
  const isLight = color === "secondary" || color === "warning" || color === "pink" || color === "accent";
  return {
    backgroundColor: `var(--${color})`,
    color: isLight ? "var(--foreground)" : "var(--background)",
  };
}

function MenfessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [posts, setPosts] = useState<Menfess[]>([]);
  const [likedPosts, setLikedPosts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activePost, setActivePost] = useState<Menfess | null>(null);
  
  // Submit Post State
  const [content, setContent] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit Comment State
  const [commentContent, setCommentContent] = useState("");
  const [commentSenderName, setCommentSenderName] = useState("");
  const [commentIsAnonymous, setCommentIsAnonymous] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeComments, setActiveComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const supabase = createClient();

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("menfess")
      .select("*, menfess_comments(id), menfess_likes(id)")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase Error Menfess:", error);
      if (error.message.includes("JWT") || error.code === "PGRST301") {
        await supabase.auth.signOut();
        window.location.reload();
      }
    }
    
    if (data) setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("public:menfess")
      .on("postgres_changes", { event: "*", schema: "public", table: "menfess" }, fetchPosts)
      .on("postgres_changes", { event: "*", schema: "public", table: "menfess_comments" }, fetchPosts)
      .on("postgres_changes", { event: "*", schema: "public", table: "menfess_likes" }, fetchPosts)
      .subscribe();

    // Read likes from localStorage
    const likes: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('liked_menfess_')) {
        const postId = key.replace('liked_menfess_', '');
        likes[postId] = localStorage.getItem(key) || '';
      }
    }
    setLikedPosts(likes);

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchComments = async (menfessId: string) => {
    setIsLoadingComments(true);
    const { data } = await supabase
      .from("menfess_comments")
      .select("*")
      .eq("menfess_id", menfessId)
      .order("created_at", { ascending: true });
    
    if (data) setActiveComments(data);
    setIsLoadingComments(false);
  };

  useEffect(() => {
    if (activePost) {
      setActiveComments([]); // Clear old comments instantly
      fetchComments(activePost.id);
    } else {
      setActiveComments([]);
    }
  }, [activePost]); // Removed 'posts' dependency to avoid re-fetching on likes

  // Open modal if ?post= parameter is present
  useEffect(() => {
    const postId = searchParams.get('post');
    if (postId && posts.length > 0) {
      const target = posts.find((p) => p.id === postId);
      if (target && (!activePost || activePost.id !== target.id)) {
        setActivePost(target);
      }
    }
  }, [searchParams, posts]);

  const handleCloseModal = () => {
    setActivePost(null);
    // Clear the query parameter so it doesn't re-open when 'posts' state changes
    if (searchParams.has('post')) {
      router.replace(pathname, { scroll: false });
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading("Sending your secret...");

    const newId = crypto.randomUUID();
    sessionStorage.setItem(`my_action_${newId}`, 'true');

    const { error } = await supabase.from("menfess").insert([{
      id: newId,
      content: content.trim(),
      sender_name: isAnonymous ? "Anonymous" : senderName.trim() || "Anonymous",
      is_anonymous: isAnonymous,
      avatar_color: getRandomColor(),
    }]);

    setIsSubmitting(false);

    if (error) {
      toast.error("Failed to post menfess.", { id: loadingToast });
    } else {
      playClick();
      toast.success("Menfess posted!", { id: loadingToast });
      setIsFormOpen(false);
      setContent("");
      setSenderName("");
      setIsAnonymous(true);
      fetchPosts();
    }
  };

  const handleLike = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation(); // prevent modal opening
    
    const existingLikeId = likedPosts[postId];
    
    if (existingLikeId) {
      // UNLIKE FLOW
      // Optimistic UI update
      setLikedPosts((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      setPosts((prev) => prev.map(p => 
        p.id === postId ? { ...p, menfess_likes: p.menfess_likes?.slice(0, -1) } : p
      ));
      if (activePost?.id === postId) {
        setActivePost((prev) => prev ? { ...prev, menfess_likes: prev.menfess_likes?.slice(0, -1) } : null);
      }
      
      localStorage.removeItem(`liked_menfess_${postId}`);
      
      if (existingLikeId !== "true" && existingLikeId !== "temp") {
        await supabase.from("menfess_likes").delete().eq("id", existingLikeId);
      }
      playPop(); // Play pop on unlike too
    } else {
      // LIKE FLOW
      playPop(); // Play pop instantly
      // Optimistic UI update
      setLikedPosts((prev) => ({ ...prev, [postId]: "temp" }));
      setPosts((prev) => prev.map(p => 
        p.id === postId 
          ? { ...p, menfess_likes: [...(p.menfess_likes || []), { id: 'temp' }] }
          : p
      ));
      if (activePost?.id === postId) {
        setActivePost((prev) => prev ? { ...prev, menfess_likes: [...(prev.menfess_likes || []), { id: 'temp' }] } : null);
      }
      
      const newId = crypto.randomUUID();
      sessionStorage.setItem(`my_action_${newId}`, 'true');
      
      const { error } = await supabase.from("menfess_likes").insert([{ id: newId, menfess_id: postId }]);
      
      if (error) {
        toast.error("Failed to like.");
        setLikedPosts((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
        localStorage.removeItem(`liked_menfess_${postId}`);
        fetchPosts(); // revert
      } else {
        localStorage.setItem(`liked_menfess_${postId}`, newId);
        setLikedPosts((prev) => ({ ...prev, [postId]: newId }));
      }
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !activePost) return;

    setIsSubmittingComment(true);

    const newId = crypto.randomUUID();
    sessionStorage.setItem(`my_action_${newId}`, 'true');

    const { error } = await supabase.from("menfess_comments").insert([{
      id: newId,
      menfess_id: activePost.id,
      content: commentContent.trim(),
      sender_name: commentIsAnonymous ? "Anonymous" : commentSenderName.trim() || "Anonymous",
      is_anonymous: commentIsAnonymous,
      avatar_color: getRandomColor(),
    }]);

    setIsSubmittingComment(false);

    if (error) {
      toast.error("Failed to send comment.");
    } else {
      playClick();
      setCommentContent("");
      fetchComments(activePost.id);
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-[var(--background)]">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <SectionHeading
            title="Secret Board"
            subtitle="Drop a confession, shoutout, or just say hi. Post anonymously or leave your mark."
            className="mb-0 text-left max-w-2xl"
          />
          <div className="flex justify-center mb-8 sticky top-[100px] z-10 pointer-events-none">
            <button
              onClick={() => {
                playClick();
                setIsFormOpen(!isFormOpen);
              }}
              className="pointer-events-auto flex items-center gap-2 px-6 py-3 font-extrabold text-lg text-primary-foreground bg-primary neo-border neo-shadow-sm neo-press rounded-full hover:bg-primary/90 transition-all"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >Write Menfess
            </button>
          </div>
        </div>

        {loading ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="break-inside-avoid bg-card neo-border rounded-2xl h-48 w-full" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="neo-border rounded-2xl p-24 bg-card text-center flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-bold text-xl">It is quiet here...</p>
            <p className="text-sm mt-2">Be the first to drop a menfess!</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                onClick={() => {
                  playClick();
                  setActivePost(post);
                }}
                className="break-inside-avoid cursor-pointer bg-card neo-border neo-shadow-sm rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden group transition-all"
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
                
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>

                <div className="mt-2 pt-4 border-t-2 border-[var(--border)] flex justify-between items-center text-muted-foreground font-semibold text-sm">
                  <div className="flex gap-4">
                    <button 
                      onClick={(e) => handleLike(e, post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${likedPosts[post.id] ? 'text-danger' : 'hover:text-danger'}`}
                    >
                      <Heart className={`w-4 h-4 ${likedPosts[post.id] ? 'fill-current' : ''}`} />
                      <span>{post.menfess_likes?.length || 0} Likes</span>
                    </button>
                    <div className="flex items-center gap-1.5 group-hover:text-primary transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.menfess_comments?.length || 0} Comments</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Container>

      {/* New Post Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsFormOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-card neo-border neo-shadow rounded-3xl overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Write Menfess
                  </h2>
                  <button onClick={() => {
                    playClick();
                    setIsFormOpen(false);
                  }} className="p-2 hover:bg-muted rounded-xl transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitPost} className="space-y-4">
                  <div>
                    <textarea
                      required
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Type your secret message here..."
                      className="w-full neo-border rounded-xl p-4 bg-background resize-none focus:outline-none focus:border-primary transition-colors font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-4 bg-muted p-4 rounded-xl border-2 border-transparent">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="w-5 h-5 accent-primary cursor-pointer border-2 border-black"
                      />
                      Post Anonymously
                    </label>
                  </div>

                  {!isAnonymous && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-2">
                      <label className="block text-sm font-bold mb-2">Display Name</label>
                      <input
                        required={!isAnonymous}
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Your name or nickname"
                        className="w-full neo-border rounded-xl px-4 py-3 bg-background focus:outline-none focus:border-primary transition-colors"
                      />
                    </motion.div>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-primary text-primary-foreground font-bold text-lg neo-border neo-press rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send to Board"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Detail Modal (Comments) */}
      <AnimatePresence>
        {activePost && (
          <div key="modal" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-card neo-border neo-shadow sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6 border-b-2 border-black bg-muted flex justify-between items-center shrink-0">
                <h3 className="font-extrabold text-lg" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Thread
                </h3>
                <button
                  onClick={() => {
                    playClick();
                    handleCloseModal();
                  }}
                  className="p-2 hover:bg-background rounded-xl neo-border bg-background transition-colors neo-press"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {/* Original Post */}
                <div className="flex gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl border-2 border-black shrink-0"
                    style={getAvatarStyle(activePost.avatar_color)}
                  >
                    {activePost.is_anonymous ? "?" : activePost.sender_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-extrabold text-lg">
                        {activePost.is_anonymous ? "Anonymous" : activePost.sender_name}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {new Date(activePost.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed text-lg">
                      {activePost.content}
                    </p>
                    
                    <div className="mt-4 flex gap-4 text-muted-foreground font-semibold text-sm">
                      <button 
                        onClick={(e) => handleLike(e, activePost.id)}
                        className={`flex items-center gap-1.5 transition-colors bg-muted px-3 py-1.5 rounded-lg border-2 hover:border-danger/20 ${likedPosts[activePost.id] ? 'text-danger border-danger/20' : 'border-transparent hover:text-danger'}`}
                      >
                        <Heart className={`w-4 h-4 ${likedPosts[activePost.id] ? 'fill-current' : ''}`} />
                        <span>{activePost.menfess_likes?.length || 0} Likes</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="w-full h-0.5 bg-border rounded-full" />

                {/* Comments List */}
                <div className="space-y-5 pl-4 sm:pl-12">
                  {isLoadingComments ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : activeComments.length === 0 ? (
                    <p className="text-muted-foreground font-semibold text-sm text-center py-4">No comments yet. Be the first to reply!</p>
                  ) : (
                    activeComments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-black shrink-0"
                          style={getAvatarStyle(comment.avatar_color)}
                        >
                          {comment.is_anonymous ? "?" : comment.sender_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-sm">
                              {comment.is_anonymous ? "Anonymous" : comment.sender_name}
                            </span>
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Comment Input */}
              <div className="p-4 bg-muted border-t-2 border-black shrink-0">
                <form onSubmit={handleSubmitComment} className="flex flex-col gap-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <textarea
                        required
                        rows={2}
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full neo-border rounded-xl px-4 py-3 bg-background resize-none focus:outline-none focus:border-primary transition-colors text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if(commentContent.trim()) handleSubmitComment(e);
                          }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmittingComment || !commentContent.trim()}
                      className="px-6 py-3 bg-primary text-primary-foreground font-bold neo-border neo-press rounded-xl h-[52px] disabled:opacity-50 flex items-center justify-center shrink-0"
                    >
                      {isSubmittingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reply"}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={commentIsAnonymous}
                        onChange={(e) => setCommentIsAnonymous(e.target.checked)}
                        className="w-4 h-4 accent-primary cursor-pointer border-2 border-black"
                      />
                      Reply Anonymously
                    </label>
                    {!commentIsAnonymous && (
                      <input
                        required={!commentIsAnonymous}
                        value={commentSenderName}
                        onChange={(e) => setCommentSenderName(e.target.value)}
                        placeholder="Your name..."
                        className="px-3 py-1 bg-background neo-border rounded-lg max-w-[150px] h-8"
                      />
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MenfessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <MenfessContent />
    </Suspense>
  );
}
