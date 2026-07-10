"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { createBrowserClient } from '@supabase/ssr';
import { Mail, MessageCircle, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { playDing } from "@/lib/sounds";

const ToastItem = ({ t, icon: Icon, iconBg, titleNode, content, onClick }: any) => {
  const [exitX, setExitX] = useState<number | "default">("default");

  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ 
        opacity: t.visible ? 1 : 0, 
        x: t.visible ? 0 : (exitX === "default" ? 32 : exitX) 
      }}
      transition={
        exitX === "default" 
          ? { duration: 0.3, type: "spring", bounce: 0.2 } 
          : { type: "tween", duration: 0.2 }
      }
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(e, info) => {
        if (Math.abs(info.offset.x) > 50) {
          setExitX(info.offset.x > 0 ? window.innerWidth : -window.innerWidth);
          toast.dismiss(t.id);
        }
      }}
      className={`max-w-sm w-full bg-[var(--background)] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl pointer-events-auto flex items-center p-3 gap-3 cursor-pointer`}
      onClick={onClick}
    >
      <div className={`w-10 h-10 shrink-0 rounded-full border-2 border-black flex items-center justify-center`} style={{ backgroundColor: iconBg }}>
         <Icon className="w-5 h-5 text-black" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[var(--foreground)] truncate">
          {titleNode}
        </p>
        <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5 line-clamp-2">
          "{content}"
        </p>
      </div>
    </motion.div>
  );
};

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
        
        if (sessionStorage.getItem(`my_action_${newMenfess.id}`)) {
          sessionStorage.removeItem(`my_action_${newMenfess.id}`);
          return;
        }

        if (toastedIds.current.has(newMenfess.id)) return;
        toastedIds.current.add(newMenfess.id);
        setTimeout(() => toastedIds.current.delete(newMenfess.id), 10000);

        playDing(); // Notification sound

        toast.custom((t) => (
          <ToastItem
            t={t}
            icon={Mail}
            iconBg={`var(--${newMenfess.avatar_color})`}
            titleNode={
              <>
                <span className="text-[var(--primary)]">{newMenfess.sender_name}</span>
                <span className="text-xs text-[var(--muted-foreground)] ml-1 font-normal">dropped a menfess 💌</span>
              </>
            }
            content={newMenfess.content}
            onClick={() => {
              toast.dismiss(t.id);
              router.push(`/menfess?post=${newMenfess.id}`);
            }}
          />
        ), { duration: 5000, id: newMenfess.id });
      })
      .subscribe();

    // Subscribe to new comments
    const commentsSubscription = supabase
      .channel('comments-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'menfess_comments' }, async (payload) => {
        const newComment = payload.new;
        
        if (sessionStorage.getItem(`my_action_${newComment.id}`)) {
          sessionStorage.removeItem(`my_action_${newComment.id}`);
          return;
        }

        if (toastedIds.current.has(newComment.id)) return;
        toastedIds.current.add(newComment.id);
        setTimeout(() => toastedIds.current.delete(newComment.id), 10000);

        // Fetch original menfess to know who they are replying to
        const { data: originalMenfess } = await supabase
          .from('menfess')
          .select('sender_name')
          .eq('id', newComment.menfess_id)
          .single();

        const repliedTo = originalMenfess?.sender_name || "Anonymous";

        playDing(); // Notification sound

        toast.custom((t) => (
          <ToastItem
            t={t}
            icon={MessageCircle}
            iconBg={`var(--${newComment.avatar_color})`}
            titleNode={
              <>
                <span className="text-[var(--primary)]">{newComment.sender_name}</span>
                <span className="text-xs text-[var(--muted-foreground)] ml-1 font-normal">replied to {repliedTo} 💬</span>
              </>
            }
            content={newComment.content}
            onClick={() => {
              toast.dismiss(t.id);
              router.push(`/menfess?post=${newComment.menfess_id}`);
            }}
          />
        ), { duration: 5000, id: newComment.id });
      })
      .subscribe();

    // Subscribe to new likes
    const likesSubscription = supabase
      .channel('likes-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'menfess_likes' }, async (payload) => {
        const newLike = payload.new;
        
        if (sessionStorage.getItem(`my_action_${newLike.id}`)) {
          sessionStorage.removeItem(`my_action_${newLike.id}`);
          return;
        }

        if (toastedIds.current.has(newLike.id)) return;
        toastedIds.current.add(newLike.id);
        setTimeout(() => toastedIds.current.delete(newLike.id), 10000);

        // Fetch original menfess to show content
        const { data: originalMenfess } = await supabase
          .from('menfess')
          .select('content, sender_name, avatar_color')
          .eq('id', newLike.menfess_id)
          .single();

        if (!originalMenfess) return;

        playDing(); // Notification sound

        toast.custom((t) => (
          <ToastItem
            t={t}
            icon={Heart}
            iconBg={`var(--${originalMenfess.avatar_color})`}
            titleNode={
              <>
                <span className="text-[var(--danger)]">Someone</span>
                <span className="text-xs text-[var(--muted-foreground)] ml-1 font-normal">liked a menfess ❤️</span>
              </>
            }
            content={originalMenfess.content}
            onClick={() => {
              toast.dismiss(t.id);
              router.push(`/menfess?post=${newLike.menfess_id}`);
            }}
          />
        ), { duration: 5000, id: newLike.id });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(menfessSubscription);
      supabase.removeChannel(commentsSubscription);
      supabase.removeChannel(likesSubscription);
    };
  }, []);

  return null;
}
