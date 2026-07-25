"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, MessageSquare, Loader2, AlertCircle, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { logAdminAction } from "@/lib/admin-logger";

type Menfess = {
  id: string;
  content: string;
  sender_name: string;
  is_anonymous: boolean;
  avatar_color: string;
  created_at: string;
  is_approved: boolean;
  menfess_comments: Comment[];
};

type Comment = {
  id: string;
  menfess_id: string;
  content: string;
  sender_name: string;
  is_anonymous: boolean;
  created_at: string;
};

export default function AdminMenfessPage() {
  const [posts, setPosts] = useState<Menfess[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("menfess")
      .select("*, menfess_comments(*)")
      .order("created_at", { ascending: false });
    
    if (data) {
      const sortedData = data.map((post: any) => ({
        ...post,
        menfess_comments: post.menfess_comments.sort((a: Comment, b: Comment) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      }));
      setPosts(sortedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("admin:menfess")
      .on("postgres_changes", { event: "*", schema: "public", table: "menfess" }, fetchPosts)
      .on("postgres_changes", { event: "*", schema: "public", table: "menfess_comments" }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprovePost = async (id: string) => {
    setProcessingId(id);
    const postToApprove = posts.find(p => p.id === id);
    
    try {
      const response = await fetch("/api/admin/menfess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "post", action: "approve", id }),
      });

      if (!response.ok) throw new Error("Failed to approve post");

      logAdminAction("Approved Menfess", `Menfess content: ${postToApprove?.content.substring(0, 50)}...`);
      toast.success("Post approved");
      fetchPosts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve post");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this menfess? All comments will also be deleted.")) return;
    
    setProcessingId(id);
    const postToDelete = posts.find(p => p.id === id);
    
    try {
      const response = await fetch("/api/admin/menfess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "post", action: "delete", id }),
      });

      if (!response.ok) throw new Error("Failed to delete post");

      logAdminAction("Deleted Menfess", `Menfess content: ${postToDelete?.content.substring(0, 50)}...`);
      toast.success("Post deleted");
      fetchPosts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete post");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    
    setProcessingId(id);
    
    try {
      const response = await fetch("/api/admin/menfess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "comment", action: "delete", id }),
      });

      if (!response.ok) throw new Error("Failed to delete comment");

      logAdminAction("Deleted Comment", `Comment ID: ${id}`);
      toast.success("Comment deleted");
      fetchPosts();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete comment");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredPosts = posts.filter(post => 
    activeTab === "pending" ? !post.is_approved : post.is_approved
  );

  const pendingCount = posts.filter(p => !p.is_approved).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Menfess Moderation
          </h1>
          <p className="text-muted-foreground font-medium">
            Review, approve, and manage community secret board posts.
          </p>
        </div>
        
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50 w-full md:w-auto shadow-inner">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "pending" 
                ? "bg-warning text-warning-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            Pending
            {pendingCount > 0 && (
              <span className="bg-background/20 text-warning-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all ${
              activeTab === "approved" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {activeTab === "pending" && (
        <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl flex gap-3 items-start shadow-sm">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-warning-foreground/90">
            Posts waiting for approval will not be visible on the public board until you approve them.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border/50 rounded-2xl bg-card/50 backdrop-blur-md">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-bold text-lg">
              {activeTab === "pending" ? "No pending posts" : "No approved posts"}
            </h3>
            <p className="text-muted-foreground">
              {activeTab === "pending" ? "You're all caught up!" : "The board is empty."}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className="border border-border/50 bg-card/50 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden transition-all hover:shadow-md">
              {/* Post Header/Content */}
              <div className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                      <span className="font-bold text-lg text-foreground">
                        {post.is_anonymous ? "Anonymous" : post.sender_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-muted border border-border/50 text-muted-foreground">
                        {post.is_anonymous ? "Anon" : "Public"}
                      </span>
                      {post.is_approved ? (
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-success/10 text-success border border-success/20 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-warning/10 text-warning border border-warning/20 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-medium ml-1">
                        {format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {!post.is_approved && (
                      <button
                        onClick={() => handleApprovePost(post.id)}
                        disabled={processingId === post.id}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
                        title="Approve Post"
                      >
                        {processingId === post.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </>
                        )}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={processingId === post.id}
                      className="p-2 text-danger hover:bg-danger hover:text-danger-foreground border border-transparent hover:border-danger/20 rounded-xl transition-all disabled:opacity-50"
                      title={activeTab === "pending" ? "Reject & Delete" : "Delete Post"}
                    >
                      {processingId === post.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              {post.menfess_comments && post.menfess_comments.length > 0 && (
                <div className="bg-muted/30 border-t border-border/50 p-4 sm:p-6 space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {post.menfess_comments.length} Comments
                  </h4>
                  
                  <div className="space-y-3">
                    {post.menfess_comments.map((comment) => (
                      <div key={comment.id} className="flex justify-between items-start gap-4 bg-background/50 border border-border/50 rounded-xl p-4 shadow-sm group transition-all hover:bg-background">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-semibold text-sm text-foreground">
                              {comment.is_anonymous ? "Anonymous" : comment.sender_name}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">
                              {format(new Date(comment.created_at), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                        </div>

                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={processingId === comment.id}
                          className="p-2 text-danger hover:bg-danger hover:text-danger-foreground rounded-lg transition-colors shrink-0 disabled:opacity-50 opacity-0 group-hover:opacity-100"
                          title="Delete Comment"
                        >
                          {processingId === comment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
