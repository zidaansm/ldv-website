"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Plus, ArrowLeft, Edit2, Users, Search } from "lucide-react";
import Link from "next/link";
import { logAdminAction } from "@/lib/admin-logger";
import toast from "react-hot-toast";
import { confirmDelete } from "@/components/shared";

type Member = {
  id: string;
  name: string;
  bio: string;
  avatar_url: string;
  accent_color: string;
};

export default function memberAdminPage() {
  const [memberList, setmemberList] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  // Form State
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("https://tr.rbxcdn.com/38c6edcb50633730ff4cf3945bf13655/150/150/AvatarHeadshot/Png");
  const [accentColor, setAccentColor] = useState("purple");

  useEffect(() => {
    fetchmember();
  }, []);

  const fetchmember = async () => {
    const { data } = await supabase.from("members").select("*").order("created_at", { ascending: false });
    if (data) setmemberList(data);
    setLoading(false);
  };

  const handleEditClick = (member: Member) => {
    setEditingId(member.id);
    setName(member.name);
    setBio(member.bio);
    setAvatarUrl(member.avatar_url);
    setAccentColor(member.accent_color);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setBio("");
    setAvatarUrl("https://tr.rbxcdn.com/38c6edcb50633730ff4cf3945bf13655/150/150/AvatarHeadshot/Png");
    setAccentColor("purple");
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    confirmDelete("member", async () => {
      const loadingToast = toast.loading("Removing member...");
      const memberToDelete = memberList.find(m => m.id === id);
      const { error } = await supabase.from("members").delete().eq("id", id);
      
      if (error) {
        toast.error("Failed to remove member", { id: loadingToast });
      } else {
        logAdminAction("Removed Member", `Removed: ${memberToDelete?.name || id}`);
        toast.success("Member removed successfully!", { id: loadingToast });
        fetchmember();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading(editingId ? "Updating member..." : "Adding member...");
    
    const memberData = { name, bio, avatar_url: avatarUrl, accent_color: accentColor };
    
    let error;
    if (editingId) {
      const res = await supabase.from("members").update(memberData).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("members").insert([memberData]);
      error = res.error;
    }

    setIsSubmitting(false);

    if (error) {
      toast.error(`Failed to ${editingId ? "update" : "add"} member`, { id: loadingToast });
    } else {
      logAdminAction(editingId ? "Updated Member" : "Added Member", `Member: ${name}`);
      toast.success(`member ${editingId ? "updated" : "added"} successfully!`, { id: loadingToast });
      resetForm();
      fetchmember();
    }
  };

  if (loading) return <div className="p-8 font-bold text-center">Loading member...</div>;

  const filteredMembers = memberList.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.bio.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl neo-border bg-card hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            member Management
          </h1>
        </div>
        <button
          onClick={() => isFormOpen ? resetForm() : setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground neo-border neo-shadow-sm neo-press rounded-xl font-bold"
        >
          <Plus className={`w-5 h-5 transition-transform ${isFormOpen ? "rotate-45" : ""}`} />
          {isFormOpen ? "Cancel" : "Add member"}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search members by name or bio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full neo-border rounded-xl pl-10 pr-4 py-3 bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
        />
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="neo-border rounded-2xl p-6 bg-card space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold mb-4">{editingId ? "Edit member member" : "Add New member member"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-bold">Bio</label>
                <span className={`text-xs font-semibold ${bio.length >= 80 ? 'text-danger' : 'text-muted-foreground'}`}>
                  {bio.length}/80
                </span>
              </div>
              <input required maxLength={80} value={bio} onChange={e => setBio(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background" />
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
              {isSubmitting ? "Saving..." : "Save member"}
            </button>
          </div>
        </form>
      )}

      {filteredMembers.length === 0 ? (
        <div className="neo-border rounded-2xl p-12 bg-card text-center flex flex-col items-center justify-center text-muted-foreground">
          <Users className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-bold text-lg">No member members found</p>
          <p className="text-sm">Click "Add member" to start building your team.</p>
        </div>
      ) : (
        <div className="neo-border rounded-2xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--neo-border)] bg-muted/50">
                  <th className="p-4 font-bold text-muted-foreground w-16">Avatar</th>
                  <th className="p-4 font-bold text-muted-foreground">Name</th>
                  <th className="p-4 font-bold text-muted-foreground">Bio</th>
                  <th className="p-4 font-bold text-muted-foreground w-32">Theme</th>
                  <th className="p-4 font-bold text-muted-foreground w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const colorMap: Record<string, string> = {
                    purple: "#6b2157", pink: "#db2777", cyan: "#0891b2", danger: "#e53e3e",
                    success: "#38a169", warning: "#d69e2e", "neo-red": "#FF2B2B", "neo-yellow": "#FFD600",
                    "neo-blue": "#0047FF", "neo-purple": "#7B00FF", "neo-pink": "#FF006E",
                    "neo-orange": "#FF5C00", "neo-green": "#00C44F", "neo-dark": "#1A1A2E",
                  };
                  const color = colorMap[member.accent_color] || colorMap.purple;

                  return (
                    <tr key={member.id} className="border-b last:border-0 border-[var(--neo-border)]/20 hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center border-2 border-[var(--neo-border)]" style={{ borderColor: color }}>
                          <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "https://tr.rbxcdn.com/38c6edcb50633730ff4cf3945bf13655/150/150/AvatarHeadshot/Png")} />
                        </div>
                      </td>
                      <td className="p-4 font-bold">{member.name}</td>
                      <td className="p-4 text-muted-foreground">{member.bio}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-black" style={{ backgroundColor: color }} />
                          <span className="text-sm font-medium">{member.accent_color.replace('neo-', '').toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEditClick(member)} className="p-2 bg-background border-2 border-[var(--neo-border)] hover:bg-muted rounded-lg transition-all hover:-translate-y-0.5" title="Edit Member">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(member.id)} className="p-2 bg-background border-2 border-danger text-danger hover:bg-danger hover:text-white rounded-lg transition-all hover:-translate-y-0.5" title="Delete Member">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
