"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Plus, ArrowLeft, Edit2, Users } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { confirmDelete } from "@/components/shared";

type Team = {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
  accent_color: string;
};

export default function TeamAdminPage() {
  const [TeamList, setTeamList] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClient();

  // Form State
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("https://tr.rbxcdn.com/38c6edcb50633730ff4cf3945bf13655/150/150/AvatarHeadshot/Png");
  const [accentColor, setAccentColor] = useState("purple");

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    const { data } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
    if (data) setTeamList(data);
    setLoading(false);
  };

  const handleEditClick = (Team: Team) => {
    setEditingId(Team.id);
    setName(Team.name);
    setRole(Team.role);
    setAvatarUrl(Team.avatar_url);
    setAccentColor(Team.accent_color);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setRole("");
    setAvatarUrl("https://tr.rbxcdn.com/38c6edcb50633730ff4cf3945bf13655/150/150/AvatarHeadshot/Png");
    setAccentColor("purple");
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    confirmDelete("Team member", async () => {
      const loadingToast = toast.loading("Removing team member...");
      const { error } = await supabase.from("staff").delete().eq("id", id);
      
      if (error) {
        toast.error("Failed to remove member", { id: loadingToast });
      } else {
        toast.success("Team member removed successfully!", { id: loadingToast });
        fetchTeam();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading(editingId ? "Updating Team..." : "Adding Team...");
    
    const TeamData = { name, role, avatar_url: avatarUrl, accent_color: accentColor };
    
    let error;
    if (editingId) {
      const res = await supabase.from("staff").update(TeamData).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("staff").insert([TeamData]);
      error = res.error;
    }

    setIsSubmitting(false);

    if (error) {
      toast.error(`Failed to ${editingId ? "update" : "add"} Team`, { id: loadingToast });
    } else {
      toast.success(`Team ${editingId ? "updated" : "added"} successfully!`, { id: loadingToast });
      resetForm();
      fetchTeam();
    }
  };

  if (loading) return <div className="p-8 font-bold text-center">Loading Team...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl neo-border bg-card hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Team Management
          </h1>
        </div>
        <button
          onClick={() => isFormOpen ? resetForm() : setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground neo-border neo-shadow-sm neo-press rounded-xl font-bold"
        >
          <Plus className={`w-5 h-5 transition-transform ${isFormOpen ? "rotate-45" : ""}`} />
          {isFormOpen ? "Cancel" : "Add Team"}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="neo-border rounded-2xl p-6 bg-card space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Team Member" : "Add New Team Member"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Role (e.g. Admin, Mod)</label>
              <input required value={role} onChange={e => setRole(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Roblox Avatar URL</label>
              <input required value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background" />
              <p className="text-xs text-muted-foreground mt-1">Right-click avatar image on Roblox &rarr; Copy Image Address</p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Theme Color</label>
              <select value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background">
                <optgroup label="Pastel Colors">
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                  <option value="cyan">Cyan</option>
                  <option value="danger">Red</option>
                  <option value="success">Green</option>
                  <option value="warning">Yellow</option>
                </optgroup>
                <optgroup label="Neo Colors">
                  <option value="neo-red">Neo Red</option>
                  <option value="neo-yellow">Neo Yellow</option>
                  <option value="neo-blue">Neo Blue</option>
                  <option value="neo-purple">Neo Purple</option>
                  <option value="neo-pink">Neo Pink</option>
                  <option value="neo-orange">Neo Orange</option>
                  <option value="neo-green">Neo Green</option>
                  <option value="neo-dark">Neo Dark</option>
                </optgroup>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-accent text-accent-foreground font-bold neo-border rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Team"}
            </button>
          </div>
        </form>
      )}

      {TeamList.length === 0 ? (
        <div className="neo-border rounded-2xl p-12 bg-card text-center flex flex-col items-center justify-center text-muted-foreground">
          <Users className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-bold text-lg">No Team members found</p>
          <p className="text-sm">Click "Add Team" to start building your team.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TeamList.map((Team) => {
            const colorMap: Record<string, string> = {
              purple: "#6b2157",
              pink: "#db2777",
              cyan: "#0891b2",
              danger: "#e53e3e",
              success: "#38a169",
              warning: "#d69e2e",
              "neo-red": "#FF2B2B",
              "neo-yellow": "#FFD600",
              "neo-blue": "#0047FF",
              "neo-purple": "#7B00FF",
              "neo-pink": "#FF006E",
              "neo-orange": "#FF5C00",
              "neo-green": "#00C44F",
              "neo-dark": "#1A1A2E",
            };
            const color = colorMap[Team.accent_color] || colorMap.purple;

            return (
              <div
                key={Team.id}
                className="rounded-2xl bg-card p-6 flex flex-col items-center relative group"
                style={{
                  border: `3px solid ${color}`,
                  boxShadow: `4px 4px 0 ${color}`,
                }}
              >
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEditClick(Team)} className="p-2 bg-background neo-border hover:bg-muted rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(Team.id)} className="p-2 bg-background neo-border text-danger hover:bg-danger/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div
                  className="w-24 h-24 rounded-full mb-4 overflow-hidden flex items-center justify-center"
                  style={{ border: `3px solid ${color}` }}
                >
                  <img src={Team.avatar_url} alt={Team.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "https://tr.rbxcdn.com/38c6edcb50633730ff4cf3945bf13655/150/150/AvatarHeadshot/Png")} />
                </div>
                <h3 className="text-xl font-bold">{Team.name}</h3>
                <p className="font-semibold" style={{ color }}>{Team.role}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
