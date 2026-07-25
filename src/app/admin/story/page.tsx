"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, X, Trash2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

type StorySection = {
  id: string;
  title: string;
  content: string;
  order_index: number;
  is_active: boolean;
};

export default function AdminStoryPage() {
  const [sections, setSections] = useState<StorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const res = await fetch("/api/admin/story");
      if (!res.ok) throw new Error("Failed to fetch story sections");
      const data = await res.json();
      setSections(data);
    } catch (error) {
      toast.error("Failed to fetch story sections");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Title and content are required");
      return;
    }

    try {
      const payload = { title, content, order_index: orderIndex, is_active: isActive };
      const url = "/api/admin/story";
      const method = editingId ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });

      if (!res.ok) throw new Error("Failed to save story section");
      
      toast.success(editingId ? "Story section updated!" : "Story section created!");
      setIsEditing(false);
      fetchSections();
      resetForm();
    } catch (error) {
      toast.error("Failed to save story section");
    }
  };

  const handleEdit = (section: StorySection) => {
    setEditingId(section.id);
    setTitle(section.title);
    setContent(section.content);
    setOrderIndex(section.order_index);
    setIsActive(section.is_active);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this story section?")) return;

    try {
      const res = await fetch(`/api/admin/story?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete story section");
      toast.success("Story section deleted!");
      fetchSections();
    } catch (error) {
      toast.error("Failed to delete story section");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setOrderIndex(sections.length > 0 ? sections.length + 1 : 1);
    setIsActive(true);
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-wider mb-2">Manage Story</h1>
          <p className="text-muted-foreground">Add and edit sections for the LDV Story/Manifesto page.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => {
              resetForm();
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wider neo-border neo-press rounded-xl"
          >
            <Plus className="w-5 h-5" />
            Add Section
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-card border-4 border-neo-border p-6 rounded-xl neo-shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold uppercase">
              {editingId ? "Edit Section" : "New Section"}
            </h2>
            <button 
              onClick={() => setIsEditing(false)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase">Section Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-background border-2 border-neo-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20"
                  placeholder="e.g. Tentang Kami"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold uppercase">Display Order (1 is first)</label>
                <input
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-background border-2 border-neo-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Content (Supports Markdown)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-48 px-4 py-3 bg-background border-2 border-neo-border rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 font-mono text-sm"
                placeholder="Write your story content here. Use markdown for headings (##) and bold (**bold**)."
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 border-2 border-neo-border rounded text-primary focus:ring-primary/20"
              />
              <label htmlFor="isActive" className="text-sm font-bold uppercase cursor-pointer">
                Section is active (visible to public)
              </label>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t-2 border-black/10">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-3 font-bold uppercase tracking-wider neo-border rounded-xl hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-primary-foreground font-bold uppercase tracking-wider neo-border neo-press rounded-xl"
              >
                {editingId ? "Update Section" : "Save Section"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {loading ? (
            <div className="text-center py-20 font-bold animate-pulse">Loading story sections...</div>
          ) : sections.length === 0 ? (
            <div className="text-center py-20 bg-card border-4 border-neo-border rounded-xl border-dashed">
              <p className="text-xl font-bold mb-2">No story sections found</p>
              <p className="text-muted-foreground">Click the "Add Section" button to create one.</p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.id} className="bg-card border-4 border-neo-border rounded-xl p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:neo-shadow-sm transition-shadow">
                
                {!section.is_active && (
                  <div className="absolute top-4 right-4 bg-muted px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 border-2 border-neo-border">
                    <EyeOff className="w-3 h-3" /> Hidden
                  </div>
                )}
                
                <div className="w-16 h-16 bg-primary text-primary-foreground neo-border rounded-xl flex items-center justify-center flex-shrink-0 font-black text-2xl">
                  #{section.order_index}
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-black mb-1 pr-24">{section.title}</h3>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t-2 border-black/10">
                    <div className="prose prose-sm dark:prose-invert max-w-none line-clamp-3">
                      <ReactMarkdown>
                        {section.content || "_No content_"}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 pt-4 md:pt-0 border-t-2 md:border-t-0 border-black/10 md:border-l-2 md:pl-6 justify-center">
                  <button
                    onClick={() => handleEdit(section)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-background border-2 border-neo-border rounded-lg font-bold hover:bg-muted transition-colors"
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(section.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 text-destructive border-2 border-destructive/20 rounded-lg font-bold hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
