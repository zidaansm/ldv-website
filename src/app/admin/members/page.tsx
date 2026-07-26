"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Plus, ArrowLeft, Edit2, Users, Search } from "lucide-react";
import Link from "next/link";
import { logAdminAction } from "@/lib/admin-logger";
import toast from "react-hot-toast";
import { confirmDelete } from "@/components/shared";
import Image from "@/components/ui/smart-image";

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

  const [limit, setLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchmember();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, limit]);

  const fetchmember = async () => {
    let query = supabase.from("members").select("*", { count: "exact" }).order("created_at", { ascending: false });
    
    if (searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`);
    }
    
    const { data, count } = await query.limit(limit);
    if (data) {
      setmemberList(data);
      setHasMore(count !== null && data.length < count);
    }
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

  if (loading) return <div className="p-8 font-bold text-center">Loading members...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl bg-background border border-border/50 hover:bg-muted transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Members Management
          </h1>
        </div>
        <button
          onClick={() => isFormOpen ? resetForm() : setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 rounded-xl font-semibold transition-all"
        >
          <Plus className={`w-5 h-5 transition-transform ${isFormOpen ? "rotate-45" : ""}`} />
          {isFormOpen ? "Cancel" : "Add Member"}
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
          className="w-full border border-border/50 shadow-sm rounded-xl pl-10 pr-4 py-3 bg-card focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="border border-border/50 shadow-sm rounded-2xl p-6 bg-card/50 backdrop-blur-md space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Member" : "Add New Member"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold">Bio</label>
                <span className={`text-xs font-semibold ${bio.length >= 80 ? 'text-danger' : 'text-muted-foreground'}`}>
                  {bio.length}/80
                </span>
              </div>
              <input required maxLength={80} value={bio} onChange={e => setBio(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Roblox Avatar URL</label>
              <input required value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              <p className="text-xs text-muted-foreground mt-1">Right-click avatar image on Roblox &rarr; Copy Image Address</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Theme Color</label>
              <select value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all">
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
              className="px-6 py-2 bg-accent text-accent-foreground font-semibold shadow-md shadow-accent/20 hover:-translate-y-0.5 rounded-xl disabled:opacity-50 transition-all"
            >
              {isSubmitting ? "Saving..." : "Save Member"}
            </button>
          </div>
        </form>
      )}

      {memberList.length === 0 ? (
        <div className="border border-border/50 shadow-sm rounded-2xl p-12 bg-card/50 backdrop-blur-md text-center flex flex-col items-center justify-center text-muted-foreground">
          <Users className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-bold text-lg text-foreground mb-1">No members found</p>
          <p className="text-sm mb-6">Start building your community by adding members here.</p>
          <button
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 rounded-xl font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      ) : (
        <div className="border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card/50 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border/50">
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">Avatar</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bio</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">Theme</th>
                  <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {memberList.map((member) => {
                  const colorMap: Record<string, string> = {
                    purple: "#6b2157", pink: "#db2777", cyan: "#0891b2", danger: "#e53e3e",
                    success: "#38a169", warning: "#d69e2e", "neo-red": "#FF2B2B", "neo-yellow": "#FFD600",
                    "neo-blue": "#0047FF", "neo-purple": "#7B00FF", "neo-pink": "#FF006E",
                    "neo-orange": "#FF5C00", "neo-green": "#00C44F", "neo-dark": "#1A1A2E",
                  };
                  const color = colorMap[member.accent_color] || colorMap.purple;

                  return (
                    <tr key={member.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex items-center justify-center border-2 shadow-sm relative" style={{ borderColor: color }}>
                          <Image src={member.avatar_url} alt={member.name} fill sizes="48px" className="object-cover" />
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm text-foreground">{member.name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{member.bio}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border border-black/20 shadow-inner" style={{ backgroundColor: color }} />
                          <span className="text-xs font-semibold tracking-wider">{member.accent_color.replace('neo-', '').toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditClick(member)} className="p-2 bg-background border border-border/50 text-foreground hover:bg-muted rounded-lg transition-colors" title="Edit Member">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(member.id)} className="p-2 bg-danger/10 text-danger hover:bg-danger hover:text-danger-foreground rounded-lg transition-colors" title="Delete Member">
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

      {memberList.length > 0 && hasMore && (
        <div className="flex justify-center pt-2 pb-8">
          <button
            onClick={() => setLimit(prev => prev + 20)}
            className="px-8 py-3 bg-card/80 backdrop-blur-md border border-border/50 text-foreground shadow-sm hover:shadow-md hover:-translate-y-0.5 rounded-xl font-bold transition-all"
          >
            Load More Members
          </button>
        </div>
      )}
    </div>
  );
}
