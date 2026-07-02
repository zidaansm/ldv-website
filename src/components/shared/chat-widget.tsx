"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: "user", content: inputValue };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, lang: language })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      if (!response.body) throw new Error("No stream found");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMessageId, role: "assistant", content: "" }]);

      let currentResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        currentResponse += decoder.decode(value, { stream: true });
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, content: currentResponse } : msg
          )
        );
      }

      // If stream ended with no content (e.g. backend failed mid-stream or crashed internally)
      if (!currentResponse) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: language === "id" ? "Maaf, sistem AI kita lagi ada gangguan. Coba lagi dalam beberapa saat ya! 🙏" : "Sorry, our AI system is currently experiencing issues. Please try again later! 🙏" } 
              : msg
          )
        );
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-4 md:right-8 w-[350px] sm:w-[400px] max-h-[600px] h-[80vh] bg-card neo-border shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 border-b-[3px] border-black flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6" />
                <div>
                  <h3 className="font-bold text-lg leading-tight">Dolce's Assistant</h3>
                  <p className="text-xs opacity-90 font-medium">
                    {language === "id" ? "Siap bantu jawab seputar LDV!" : "Ready to help with LDV!"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-black/20 rounded-md transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-4 bg-background">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-70 p-4">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-bold text-lg">
                    {language === "id" 
                      ? "Halo! Ada yang bisa dibantu soal La Dolce Vita?" 
                      : "Hello! How can I help you with La Dolce Vita?"}
                  </p>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 max-w-[85%] ${
                      m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full border-[2px] border-black flex items-center justify-center shrink-0 ${
                      m.role === "user" ? "bg-[#FFD600] text-black" : "bg-primary text-primary-foreground"
                    }`}>
                      {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-3 rounded-xl border-[2px] border-black ${
                      m.role === "user" 
                        ? "bg-[#FFD600] text-black rounded-tr-sm" 
                        : "bg-white text-black rounded-tl-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    }`}>
                      <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex gap-3 max-w-[85%] mr-auto">
                   <div className="w-8 h-8 rounded-full border-[2px] border-black flex items-center justify-center shrink-0 bg-primary text-primary-foreground">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-xl border-[2px] border-black bg-white rounded-tl-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 text-black">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-bold">Typing...</span>
                  </div>
                </div>
              )}
              
              {error && (
                <div className="bg-red-100 border-[2px] border-red-500 text-red-700 p-3 rounded-lg text-sm font-bold flex items-center justify-between">
                  <span>
                    {language === "id" ? "Duh, koneksi lagi bermasalah. Coba lagi ya!" : "Oops, connection error. Please try again!"}
                  </span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t-[3px] border-black shrink-0">
              <form 
                onSubmit={handleSubmit} 
                className="flex gap-2 relative"
              >
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={language === "id" ? "Tanya sesuatu..." : "Ask something..."}
                  className="flex-grow p-3 pr-12 neo-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary font-bold text-black"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="absolute right-2 top-2 bottom-2 p-2 bg-primary text-primary-foreground neo-border rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 md:right-8 w-14 h-14 bg-primary text-primary-foreground rounded-full border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center z-50 hover:bg-primary/90 transition-colors"
        aria-label="Toggle chat"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
