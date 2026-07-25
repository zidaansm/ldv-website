"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, ArrowLeft, Edit2, X, Handshake, GripVertical } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { confirmDelete } from "@/components/shared";
import ReactMarkdown from "react-markdown";

type Collaboration = {
  id: string;
  title: string;
  icon: string;
  description: string;
  order_index: number;
  created_at: string;
};

export default function CollaborationsAdminPage() {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCollab, setEditingCollab] = useState<Collaboration | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);

  useEffect(() => {
    fetchCollaborations();
  }, []);

  const fetchCollaborations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/collaborations');
      if (res.ok) {
        const data = await res.json();
        setCollaborations(data.collaborations);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to fetch collaborations");
      }
    } catch (e) {
      toast.error("An error occurred while fetching collaborations");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setIcon("");
    setDescription("");
    setOrderIndex(0);
    setEditingCollab(null);
    setIsFormOpen(false);
  };

  const openEdit = (collab: Collaboration) => {
    setEditingCollab(collab);
    setTitle(collab.title || "");
    setIcon(collab.icon || "");
    setDescription(collab.description || "");
    setOrderIndex(collab.order_index || 0);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    confirmDelete(`Collaboration "${title}"`, async () => {
      const loadingToast = toast.loading("Deleting collaboration...");
      
      try {
        const res = await fetch(`/api/admin/collaborations?id=${id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          toast.success("Collaboration deleted successfully!", { id: loadingToast });
          fetchCollaborations();
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to delete collaboration", { id: loadingToast });
        }
      } catch (e) {
        toast.error("An error occurred during deletion", { id: loadingToast });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !icon) {
      toast.error("Title and Icon are required");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(editingCollab ? "Updating collaboration..." : "Creating collaboration...");

    const payload = {
      id: editingCollab?.id,
      title,
      icon,
      description,
      order_index: orderIndex
    };

    try {
      const res = await fetch('/api/admin/collaborations', {
        method: editingCollab ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingCollab ? "Collaboration updated!" : "Collaboration created!", { id: loadingToast });
        resetForm();
        fetchCollaborations();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save collaboration", { id: loadingToast });
      }
    } catch (e) {
      toast.error("An error occurred while saving", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Collaboration Program
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Manage collaboration types and descriptions.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/admin"
            className="px-4 py-2 bg-background border border-border/50 text-foreground font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-muted transition-colors shadow-sm flex-1 sm:flex-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:-translate-y-0.5 rounded-xl flex items-center justify-center gap-2 transition-all flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            New Collab
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-card/50 backdrop-blur-md border border-border/50 shadow-sm rounded-xl p-6">
          <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Handshake className="w-5 h-5 text-primary" />
              {editingCollab ? "Edit Collaboration" : "Add New Collaboration"}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Icon (Emoji)</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background font-bold text-center text-2xl focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="🛒"
                  required
                />
              </div>
              
              <div className="md:col-span-8">
                <label className="block text-sm font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background font-semibold focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Marketplace Collaboration"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">Order</label>
                <input
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background font-semibold text-center focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all mb-2"
                placeholder="Describe this collaboration program..."
              />
              <div className="bg-muted/50 border border-border/50 rounded-xl p-3 text-xs font-medium space-y-1">
                <p className="font-semibold mb-1 text-foreground">Markdown is supported:</p>
                <p className="text-muted-foreground"><code className="bg-background px-1 border border-border/50 rounded"># Heading 1</code> | <code className="bg-background px-1 border border-border/50 rounded">## Heading 2</code></p>
                <p className="text-muted-foreground"><code className="bg-background px-1 border border-border/50 rounded">**Bold Text**</code> | <code className="bg-background px-1 border border-border/50 rounded">*Italic Text*</code></p>
                <p className="text-muted-foreground"><code className="bg-background px-1 border border-border/50 rounded">- List item</code> | <code className="bg-background px-1 border border-border/50 rounded">1. Numbered list</code></p>
                <p className="text-muted-foreground"><code className="bg-background px-1 border border-border/50 rounded">[Link Name](https://link.com)</code></p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-background border border-border/50 text-foreground font-semibold rounded-xl hover:bg-muted transition-colors shadow-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:-translate-y-0.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : editingCollab ? "Update Collab" : "Create Collab"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-card/50 border border-border/50 rounded-xl w-full" />
          ))}
        </div>
      ) : collaborations.length === 0 ? (
        <div className="bg-card/50 backdrop-blur-md border border-border/50 shadow-sm rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <Handshake className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground">No collaborations found</h3>
          <p className="text-muted-foreground mt-2 font-medium">Create a new collaboration type to display it.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {collaborations.map((collab) => (
            <div
              key={collab.id}
              className="bg-card/50 backdrop-blur-md border border-border/50 shadow-sm rounded-xl p-5 flex items-start gap-4 transition-all hover:shadow-md group"
            >
              <div className="w-12 h-12 flex-shrink-0 bg-muted/50 border border-border/50 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                {collab.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2 text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      {collab.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-3 py-1 bg-muted/50 border border-border/50 rounded-lg text-xs font-semibold flex items-center gap-1 text-muted-foreground" title="Order Index">
                      <GripVertical className="w-3 h-3" /> {collab.order_index}
                    </span>
                    <button
                      onClick={() => openEdit(collab)}
                      className="p-2 bg-background border border-border/50 text-foreground rounded-lg hover:bg-muted transition-colors shadow-sm"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(collab.id, collab.title)}
                      className="p-2 bg-danger/10 border border-transparent text-danger rounded-lg hover:bg-danger hover:text-danger-foreground transition-colors shadow-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-sm text-foreground/80 line-clamp-2">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {collab.description || "No description provided."}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
