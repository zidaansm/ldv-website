"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { MessageCircle, Send, Users } from "lucide-react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: string;
  user_id: string;
  user_email: string;
  user_name?: string;
  user_avatar?: string;
  user_role: string;
  content: string;
  created_at: string;
}

export default function TeamChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const supabase = createClient();

  useEffect(() => {
    fetchMessages();
    
    // Get current user to align messages left/right
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setCurrentUserEmail(session.user.email);
      }
    };
    getUser();

    // Subscribe to new messages via Supabase Realtime
    const channel = supabase
      .channel('team_chat_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_chat_messages' }, payload => {
        console.log('Realtime message received:', payload);
        fetchMessages();
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    // Fallback polling every 3 seconds in case realtime doesn't work
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/admin/chat?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        // Optimistically add message
        setMessages(prev => [...prev, data.message]);
        setNewMessage("");
      } else {
        toast.error("Failed to send message");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsSending(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-danger text-danger-foreground border-danger/30';
      case 'event_organizer': return 'bg-warning text-warning-foreground border-warning/30';
      default: return 'bg-primary text-primary-foreground border-primary/30';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
          <MessageCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Global Team Chat
          </h1>
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> All Admins & Roles
          </p>
        </div>
      </div>

      <div className="flex-1 bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground font-semibold animate-pulse">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No messages yet. Say hello to the team! 👋
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.user_email === currentUserEmail;
              const showAvatar = idx === 0 || messages[idx - 1].user_email !== msg.user_email;

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${showAvatar ? 'mt-6' : 'mt-1'}`}>
                  {showAvatar && (
                    <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {msg.user_avatar ? (
                        <img src={msg.user_avatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover shadow-sm border border-border/50" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold border border-border/50">
                          {(msg.user_name || msg.user_email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="text-xs font-semibold text-muted-foreground">
                        {msg.user_name ? msg.user_name : msg.user_email.split('@')[0]}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${getRoleColor(msg.user_role)}`}>
                        {msg.user_role.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  <div className={`px-4 py-2.5 max-w-[80%] break-words shadow-sm ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                      : 'bg-muted border border-border/50 rounded-2xl rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 mx-1 font-medium">
                    {format(new Date(msg.created_at), "HH:mm")}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background/50 border-t border-border/50 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-background border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            <button
              type="submit"
              disabled={isSending || !newMessage.trim()}
              className="bg-primary text-primary-foreground px-5 py-3 rounded-xl shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 font-semibold flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
