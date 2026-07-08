"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, MessageSquare, Loader2, AlertCircle } from "lucide-react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("menfess")
      .select("*, menfess_comments(*)")
      .order("created_at", { ascending: false });
    
    if (data) {
      // Sort comments for each post
      const sortedData = data.map(post => ({
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

  const handleDeletePost = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this menfess? All comments will also be deleted.")) return;
    
    setDeletingId(id);
    const postToDelete = posts.find(p => p.id === id);
    const { error } = await supabase.from("menfess").delete().eq("id", id);
    setDeletingId(null);

    if (error) {
      toast.error("Failed to delete post");
    } else {
      logAdminAction("Deleted Menfess", `Menfess content: ${postToDelete?.content.substring(0, 50)}...`);
      toast.success("Post deleted");
      fetchPosts();
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    
    setDeletingId(id);
    const { error } = await supabase.from("menfess_comments").delete().eq("id", id);
    setDeletingId(null);

    if (error) {
      toast.error("Failed to delete comment");
    } else {
      logAdminAction("Deleted Comment", `Comment ID: ${id}`);
      toast.success("Comment deleted");
      fetchPosts();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          Menfess Moderation
        </h1>
        <p className="text-muted-foreground font-medium">
          Manage and moderate community secret board posts.
        </p>
      </div>

      <div className="bg-warning/20 border-2 border-warning p-4 rounded-xl flex gap-3 items-start">
        <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <p className="text-sm font-semibold">
          Deleting a Menfess post will permanently remove it and all of its comments. Use this to remove spam or toxic content.
        </p>
      </div>

      <div className="space-y-8">
        {posts.length === 0 ? (
          <div className="text-center py-12 neo-border rounded-2xl bg-card border-dashed">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-bold text-lg">No posts yet</h3>
            <p className="text-muted-foreground">The board is completely clean.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="neo-border bg-card rounded-2xl overflow-hidden">
              {/* Post Header/Content */}
              <div className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-extrabold text-lg">
                        {post.is_anonymous ? "Anonymous" : post.sender_name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-muted neo-border">
                        {post.is_anonymous ? "Anon" : "Public"}
                      </span>
                      <span className="text-sm text-muted-foreground font-semibold">
                        {format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                  </div>
                  
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    disabled={deletingId === post.id}
                    className="p-2.5 text-danger hover:bg-danger/10 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                    title="Delete Post"
                  >
                    {deletingId === post.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {post.menfess_comments && post.menfess_comments.length > 0 && (
                <div className="bg-muted border-t-2 border-black p-4 sm:p-6 space-y-4">
                  <h4 className="font-bold text-sm text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {post.menfess_comments.length} Comments
                  </h4>
                  
                  <div className="space-y-3">
                    {post.menfess_comments.map((comment) => (
                      <div key={comment.id} className="flex justify-between items-start gap-4 bg-background neo-border rounded-xl p-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm">
                              {comment.is_anonymous ? "Anonymous" : comment.sender_name}
                            </span>
                            <span className="text-xs text-muted-foreground font-semibold">
                              {format(new Date(comment.created_at), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
                        </div>

                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deletingId === comment.id}
                          className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                          title="Delete Comment"
                        >
                          {deletingId === comment.id ? (
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
