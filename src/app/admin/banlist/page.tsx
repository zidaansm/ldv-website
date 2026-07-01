"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Plus, ArrowLeft, Edit2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { confirmDelete } from "@/components/shared";

type BanRecord = {
  id: string;
  username: string;
  discord_id?: string;
  reason: string;
  duration: string;
  banned_at: string;
};

export default function BanListAdminPage() {
  const [banList, setBanList] = useState<BanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClient();

  // Form State
  const [username, setUsername] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("");
  const [bannedAt, setBannedAt] = useState("");

  useEffect(() => {
    fetchBanList();
  }, []);

  const fetchBanList = async () => {
    const { data } = await supabase.from("banlist").select("*").order("banned_at", { ascending: false });
    if (data) setBanList(data);
    setLoading(false);
  };

  const handleEditClick = (record: BanRecord) => {
    setEditingId(record.id);
    setUsername(record.username);
    setDiscordId(record.discord_id || "");
    setReason(record.reason);
    setDuration(record.duration);
    setBannedAt(record.banned_at);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setUsername("");
    setDiscordId("");
    setReason("");
    setDuration("");
    setBannedAt("");
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    confirmDelete("ban record", async () => {
      const loadingToast = toast.loading("Removing record...");
      const { error } = await supabase.from("banlist").delete().eq("id", id);
      
      if (error) {
        toast.error("Failed to remove record", { id: loadingToast });
      } else {
        toast.success("Record removed successfully!", { id: loadingToast });
        fetchBanList();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading(editingId ? "Updating record..." : "Adding record...");
    
    const recordData = { username, discord_id: discordId, reason, duration, banned_at: bannedAt };
    
    let error;
    if (editingId) {
      const res = await supabase.from("banlist").update(recordData).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("banlist").insert([recordData]);
      error = res.error;
    }

    setIsSubmitting(false);

    if (error) {
      console.error("Supabase Error Message:", error.message);
      console.error("Supabase Error Details:", error.details, error.hint);
      toast.error(`Failed to ${editingId ? "update" : "add"} record`, { id: loadingToast });
    } else {
      toast.success(`Record ${editingId ? "updated" : "added"} successfully!`, { id: loadingToast });
      resetForm();
      fetchBanList();
    }
  };

  if (loading) return <div className="p-8 font-bold text-center">Loading ban list...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl neo-border bg-card hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Hall of Shame (Ban List)
          </h1>
        </div>
        <button
          onClick={() => isFormOpen ? resetForm() : setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground neo-border neo-shadow-sm neo-press rounded-xl font-bold"
        >
          <Plus className={`w-5 h-5 transition-transform ${isFormOpen ? "rotate-45" : ""}`} />
          {isFormOpen ? "Cancel" : "Add Record"}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="neo-border rounded-2xl p-6 bg-card space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Record" : "Add New Banned User"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Username</label>
              <input required value={username} onChange={e => setUsername(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Discord ID (Optional)</label>
              <input value={discordId} onChange={e => setDiscordId(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Duration (e.g. Permanent, 30 Days)</label>
              <input required value={duration} onChange={e => setDuration(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Banned At (Date)</label>
              <input required type="date" value={bannedAt} onChange={e => setBannedAt(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold mb-1">Reason</label>
              <textarea required value={reason} onChange={e => setReason(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background h-24" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-danger text-danger-foreground font-bold neo-border rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      )}

      {banList.length === 0 ? (
        <div className="neo-border rounded-2xl p-12 bg-card text-center flex flex-col items-center justify-center text-muted-foreground">
          <ShieldAlert className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-bold text-lg">Clean sheet!</p>
          <p className="text-sm">No one is currently banned. Good job community!</p>
        </div>
      ) : (
        <div className="neo-border rounded-2xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted border-b-2 border-[var(--border)]">
                  <th className="p-4 font-bold">Username</th>
                  <th className="p-4 font-bold">Reason</th>
                  <th className="p-4 font-bold">Duration</th>
                  <th className="p-4 font-bold">Date Banned</th>
                  <th className="p-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {banList.map((record) => (
                  <tr key={record.id} className="border-b-2 border-[var(--border)] last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-bold text-danger">{record.username}</td>
                    <td className="p-4">{record.reason}</td>
                    <td className="p-4 font-medium">{record.duration}</td>
                    <td className="p-4 font-medium text-muted-foreground">{new Date(record.banned_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEditClick(record)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(record.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
