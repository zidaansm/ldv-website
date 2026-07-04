"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { createBrowserClient } from '@supabase/ssr';
import { Mail, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function MenfessLiveToaster() {
  const toastedIds = useRef<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    // We only need this on the client side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createBrowserClient(supabaseUrl, supabaseKey);

    // Subscribe to new menfess
    const menfessSubscription = supabase
      .channel('menfess-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'menfess' }, (payload) => {
        const newMenfess = payload.new;
        
        if (toastedIds.current.has(newMenfess.id)) return;
        toastedIds.current.add(newMenfess.id);
        setTimeout(() => toastedIds.current.delete(newMenfess.id), 10000);

        toast.custom((t) => (
          <div
            className={`max-w-sm w-full bg-[var(--background)] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl pointer-events-auto flex items-center p-3 gap-3 cursor-pointer transition-all duration-300 ${
              t.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
            onClick={() => {
              toast.dismiss(t.id);
              router.push('/menfess');
            }}
          >
            <div className={`w-10 h-10 shrink-0 rounded-full border-2 border-black flex items-center justify-center`} style={{ backgroundColor: `var(--${newMenfess.avatar_color})` }}>
               <Mail className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--foreground)] truncate">
                <span className="text-[var(--primary)]">{newMenfess.sender_name}</span>
              </p>
              <p className="text-xs font-semibold text-[var(--muted-foreground)] mt-0.5 truncate">
                just dropped a new menfess! 💌
              </p>
            </div>
          </div>
        ), { duration: 5000, id: newMenfess.id });
      })
      .subscribe();

    // Subscribe to new comments
    const commentsSubscription = supabase
      .channel('comments-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'menfess_comments' }, (payload) => {
        const newComment = payload.new;
        
        if (toastedIds.current.has(newComment.id)) return;
        toastedIds.current.add(newComment.id);
        setTimeout(() => toastedIds.current.delete(newComment.id), 10000);

        toast.custom((t) => (
          <div
            className={`max-w-sm w-full bg-[var(--background)] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl pointer-events-auto flex items-center p-3 gap-3 cursor-pointer transition-all duration-300 ${
              t.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
            onClick={() => {
              toast.dismiss(t.id);
              router.push('/menfess');
            }}
          >
            <div className={`w-10 h-10 shrink-0 rounded-full border-2 border-black flex items-center justify-center`} style={{ backgroundColor: `var(--${newComment.avatar_color})` }}>
               <MessageCircle className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--foreground)] truncate">
                <span className="text-[var(--primary)]">{newComment.sender_name}</span>
              </p>
              <p className="text-xs font-semibold text-[var(--muted-foreground)] mt-0.5 truncate">
                just replied to a menfess! 💬
              </p>
            </div>
          </div>
        ), { duration: 5000, id: newComment.id });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(menfessSubscription);
      supabase.removeChannel(commentsSubscription);
    };
  }, []);

  return null;
}
