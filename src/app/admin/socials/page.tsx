"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, X, Trash2, Eye, EyeOff } from "lucide-react";
import { FaGlobe, FaComment, FaGamepad, FaBox, FaXTwitter, FaTiktok, FaYoutube, FaSteam } from "react-icons/fa6";
import toast from "react-hot-toast";

type SocialLink = {
  id: string;
  platform: string;
  url: string;
  username: string | null;
  icon_name: string;
  order_index: number;
  is_active: boolean;
};

const renderIcon = (name: string, className = "w-5 h-5") => {
  switch (name) {
    case "twitter": return <FaXTwitter className={className} />;
    case "youtube": return <FaYoutube className={className} />;
    case "tiktok": return <FaTiktok className={className} />;
    case "message": return <FaComment className={className} />;
    case "gamepad": return <FaGamepad className={className} />;
    case "steam": return <FaSteam className={className} />;
    case "box": return <FaBox className={className} />;
    case "globe":
    default: return <FaGlobe className={className} />;
  }
};

const ICON_OPTIONS = [
  { value: "globe", label: "Globe (Website)" },
  { value: "twitter", label: "Twitter / X" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "message", label: "Message / Secreto" },
  { value: "gamepad", label: "Gamepad / Roblox" },
  { value: "steam", label: "Steam" },
  { value: "box", label: "Box / Plato" }
];

export default function AdminSocialsPage() {
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [iconName, setIconName] = useState("globe");
  const [orderIndex, setOrderIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchSocials();
  }, []);

  const fetchSocials = async () => {
    try {
      const res = await fetch("/api/admin/socials");
      if (!res.ok) throw new Error("Failed to fetch social links");
      const data = await res.json();
      setSocials(data);
    } catch (error) {
      toast.error("Failed to fetch social links");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform || !url) {
      toast.error("Platform and URL are required");
      return;
    }

    try {
      const payload = { platform, url, username, icon_name: iconName, order_index: orderIndex, is_active: isActive };
      const apiUrl = "/api/admin/socials";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });

      if (!res.ok) throw new Error("Failed to save social link");
      
      toast.success(editingId ? "Social link updated!" : "Social link created!");
      setIsEditing(false);
      fetchSocials();
      resetForm();
    } catch (error) {
      toast.error("Failed to save social link");
    }
  };

  const handleEdit = (social: SocialLink) => {
    setEditingId(social.id);
    setPlatform(social.platform);
    setUrl(social.url);
    setUsername(social.username || "");
    setIconName(social.icon_name || "globe");
    setOrderIndex(social.order_index);
    setIsActive(social.is_active);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this social link?")) return;

    try {
      const res = await fetch(`/api/admin/socials?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete social link");
      toast.success("Social link deleted!");
      fetchSocials();
    } catch (error) {
      toast.error("Failed to delete social link");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setPlatform("");
    setUrl("");
    setUsername("");
    setIconName("globe");
    setOrderIndex(socials.length > 0 ? socials.length + 1 : 1);
    setIsActive(true);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>Manage Socials</h1>
          <p className="text-muted-foreground font-medium">Add and edit links for the Linktree page.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              resetForm();
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:-translate-y-0.5 rounded-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Link
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-card/50 backdrop-blur-md border border-border/50 p-6 rounded-xl shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
            <h2 className="text-xl font-bold text-foreground">
              {editingId ? "Edit Link" : "New Link"}
            </h2>
            <button 
              onClick={() => setIsEditing(false)}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Platform Name</label>
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. X / Twitter"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Target URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="https://..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Username (Optional)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="e.g. @ldvarch"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Icon</label>
                <select
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                >
                  {ICON_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Display Order (1 is first)</label>
                <input
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-background border border-border/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-xl border border-border/50">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-border/50 text-primary focus:ring-primary/20"
              />
              <label htmlFor="isActive" className="text-sm font-semibold cursor-pointer text-foreground">
                Link is active (visible to public)
              </label>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 font-semibold bg-background border border-border/50 text-foreground rounded-xl hover:bg-muted transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:-translate-y-0.5 rounded-xl transition-all"
              >
                {editingId ? "Update Link" : "Save Link"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="text-center py-20 font-semibold text-muted-foreground animate-pulse">Loading social links...</div>
          ) : socials.length === 0 ? (
            <div className="text-center py-20 bg-card/50 backdrop-blur-md border border-border/50 rounded-xl border-dashed shadow-sm">
              <p className="text-xl font-bold mb-2 text-foreground">No links found</p>
              <p className="text-muted-foreground font-medium">Click the "Add Link" button to create one.</p>
            </div>
          ) : (
            socials.map((social) => (
              <div key={social.id} className="bg-card/50 backdrop-blur-md border border-border/50 rounded-xl p-4 flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                
                <div className="flex items-center gap-4 flex-grow">
                  <div className="w-12 h-12 bg-muted/50 text-foreground border border-border/50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                    {renderIcon(social.icon_name)}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                      {social.platform}
                      {!social.is_active && (
                        <span className="bg-muted/50 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border border-border/50 text-muted-foreground">
                          <EyeOff className="w-3 h-3" /> Hidden
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm mt-1">
                      {social.username && <span className="text-foreground/80 font-medium">{social.username}</span>}
                      <span className="truncate max-w-[200px] sm:max-w-md text-primary hover:underline"><a href={social.url} target="_blank" rel="noopener noreferrer">{social.url}</a></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-center justify-center px-4 border-l border-r border-border/50 opacity-50">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order</span>
                    <span className="text-xl font-bold text-foreground">{social.order_index}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(social)}
                      className="p-2 bg-background border border-border/50 text-foreground rounded-lg hover:bg-muted transition-colors shadow-sm"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(social.id)}
                      className="p-2 bg-danger/10 text-danger border border-transparent rounded-lg hover:bg-danger hover:text-danger-foreground transition-colors shadow-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
