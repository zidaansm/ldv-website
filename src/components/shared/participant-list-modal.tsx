"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { Search, Loader2, Users } from "lucide-react";

interface ParticipantListModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: any;
  language: "en" | "id";
}

export function ParticipantListModal({ isOpen, onClose, selectedEvent, language }: ParticipantListModalProps) {
  const modalRef = useFocusTrap(isOpen, onClose);
  const [participants, setParticipants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!isOpen || !selectedEvent) return;

    async function fetchParticipants() {
      setLoading(true);
      const { data, error } = await supabase
        .from("public_participants")
        .select("*")
        .eq("event_id", selectedEvent.id)
        .order("created_at", { ascending: false });

      if (data) {
        setParticipants(data);
      } else {
        console.error("Failed to fetch participants:", error);
      }
      setLoading(false);
    }

    fetchParticipants();
  }, [isOpen, selectedEvent]);

  if (!isOpen || !selectedEvent) return null;

  const filteredParticipants = participants.filter(p => {
    const uname = (p.username || p.username_alt || "").toLowerCase();
    const matchesSearch = uname.includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || p.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        ref={modalRef as React.RefObject<HTMLDivElement>}
        role="dialog"
        aria-modal="true"
        className="bg-card neo-border neo-shadow-sm rounded-2xl p-6 md:p-8 max-w-lg w-full max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Status Peserta</h2>
            <p className="text-muted-foreground text-sm">{selectedEvent.title}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-muted hover:bg-muted/80 neo-border rounded-xl transition-colors font-bold"
          >
            Esc
          </button>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-3 mb-6">
          {["all", "approved", "pending", "rejected"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-4 py-2 rounded-xl font-bold text-xs md:text-sm capitalize transition-all neo-border neo-press",
                activeTab === tab 
                  ? "bg-primary text-primary-foreground neo-shadow-sm" 
                  : "bg-card text-foreground hover:bg-muted"
              )}
            >
              {tab} <span className="opacity-70 ml-1">({tab === "all" ? participants.length : participants.filter(p => p.status === tab).length})</span>
            </button>
          ))}
        </div>

        <div className="relative mb-6 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder={language === "id" ? "Cari Discord Username kamu..." : "Search Discord Username..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full neo-border rounded-xl pl-10 pr-4 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
        </div>

        <div className="overflow-y-auto flex-1 pr-2 neo-scrollbar">
          {loading ? (
            <div className="py-12 flex justify-center text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredParticipants.length > 0 ? (
            <div className="space-y-3">
              {filteredParticipants.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl neo-border bg-background/50 hover:bg-background transition-colors">
                  <div className="font-bold truncate pr-4">
                    {p.username || p.username_alt || "Unknown Member"}
                  </div>
                  <span className={cn(
                    "px-3 py-1 text-xs font-extrabold uppercase rounded-lg neo-border shrink-0",
                    p.status === "approved" ? "bg-success text-success-foreground" :
                    p.status === "rejected" ? "bg-danger text-danger-foreground" :
                    "bg-warning text-warning-foreground"
                  )}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Users className="w-10 h-10 opacity-50" />
              <p className="font-bold">
                {participants.length === 0 
                  ? (language === "id" ? "Belum ada pendaftar." : "No participants yet.")
                  : (language === "id" ? "Username tidak ditemukan." : "Username not found.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
