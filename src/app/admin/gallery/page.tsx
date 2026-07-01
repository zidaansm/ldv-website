"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Plus, ArrowLeft, Edit2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { confirmDelete } from "@/components/shared";

type GalleryImage = {
  id: string;
  title: string;
  image_url: string;
  created_at: string;
};

export default function GalleryAdminPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClient();

  // Form State
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    const { data } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
    if (data) setImages(data);
    setLoading(false);
  };

  const handleEditClick = (image: GalleryImage) => {
    setEditingId(image.id);
    setTitle(image.title);
    setImageUrl(image.image_url);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setImageUrl("");
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    confirmDelete("image", async () => {
      const loadingToast = toast.loading("Deleting image...");
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      
      if (error) {
        toast.error("Failed to delete image", { id: loadingToast });
      } else {
        toast.success("Image deleted successfully!", { id: loadingToast });
        fetchImages();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading(editingId ? "Updating image..." : "Uploading image...");
    
    const imageData = { title, image_url: imageUrl };
    
    let error;
    if (editingId) {
      const res = await supabase.from("gallery").update(imageData).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("gallery").insert([imageData]);
      error = res.error;
    }

    setIsSubmitting(false);

    if (error) {
      toast.error(`Failed to ${editingId ? "update" : "add"} image`, { id: loadingToast });
    } else {
      toast.success(`Image ${editingId ? "updated" : "added"} successfully!`, { id: loadingToast });
      resetForm();
      fetchImages();
    }
  };

  if (loading) return <div className="p-8 font-bold text-center">Loading gallery...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl neo-border bg-card hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Gallery Management
          </h1>
        </div>
        <button
          onClick={() => isFormOpen ? resetForm() : setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground neo-border neo-shadow-sm neo-press rounded-xl font-bold"
        >
          <Plus className={`w-5 h-5 transition-transform ${isFormOpen ? "rotate-45" : ""}`} />
          {isFormOpen ? "Cancel" : "Add Image"}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="neo-border rounded-2xl p-6 bg-card space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Image" : "Add New Image"}</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Title / Caption</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Winner of Tournament 2026" className="w-full neo-border rounded-lg px-3 py-2 bg-background" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Image / Video URL</label>
              <input required value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full neo-border rounded-lg px-3 py-2 bg-background" />
              <p className="text-xs text-muted-foreground mt-1">Provide a direct link to the file (.jpg, .png, .mp4, etc).</p>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-accent text-accent-foreground font-bold neo-border rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Media"}
            </button>
          </div>
        </form>
      )}

      {images.length === 0 ? (
        <div className="neo-border rounded-2xl p-12 bg-card text-center flex flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-bold text-lg">No media found</p>
          <p className="text-sm">Click "Add Image" to start filling up your community gallery.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {images.map((image) => (
            <div key={image.id} className="break-inside-avoid neo-border neo-shadow-sm rounded-2xl bg-card overflow-hidden flex flex-col relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => handleEditClick(image)} className="p-2 bg-background neo-border hover:bg-muted rounded-lg transition-colors shadow-sm">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(image.id)} className="p-2 bg-background neo-border text-danger hover:bg-danger/10 rounded-lg transition-colors shadow-sm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="relative w-full overflow-hidden bg-muted">
                {image.image_url.match(/\.(mp4|webm|ogg)$/i) || image.image_url.includes("mp4") ? (
                  <video 
                    src={image.image_url} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <img 
                    src={image.image_url} 
                    alt={image.title} 
                    className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500" 
                    onError={(e) => (e.currentTarget.src = "https://placehold.co/600x400/png?text=Broken+Link")} 
                  />
                )}
              </div>
              <div className="p-4 bg-card border-t-2 border-[var(--border)]">
                <h3 className="font-bold text-foreground">{image.title}</h3>
                <p className="text-xs font-semibold text-muted-foreground mt-1">{new Date(image.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
