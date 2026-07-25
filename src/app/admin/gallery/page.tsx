"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Trash2, Plus, ArrowLeft, Edit2, Image as ImageIcon,
  Upload, X, FileVideo, Link2, Info, CheckCircle2, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { confirmDelete } from "@/components/shared";
import Image from "@/components/ui/smart-image";

type GalleryImage = {
  id: string;
  title: string;
  image_url: string;
  description?: string;
  created_at: string;
};

type InputMode = "file" | "link";

const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 50;

function isVideo(url: string) {
  return !!(url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("mp4"));
}

function fileSizeOk(file: File): boolean {
  const mb = file.size / 1024 / 1024;
  if (file.type.startsWith("video")) return mb <= MAX_VIDEO_MB;
  return mb <= MAX_IMAGE_MB;
}

export default function GalleryAdminPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [showLinkGuide, setShowLinkGuide] = useState(false);
  const supabase = createClient();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [existingUrl, setExistingUrl] = useState("");

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    const { data } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
    if (data) setImages(data);
    setLoading(false);
  };



  const handleLinkChange = (url: string) => {
    setLinkUrl(url);
    if (url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)/i)) {
      setPreviewFile({ url, type: isVideo(url) ? "video" : "image" });
    } else {
      setPreviewFile(null);
    }
  };

  const handleEditClick = (image: GalleryImage) => {
    setEditingId(image.id);
    setTitle(image.title);
    setDescription(image.description || "");
    setExistingUrl(image.image_url);
    setLinkUrl(image.image_url);
    setPreviewFile({ url: image.image_url, type: isVideo(image.image_url) ? "video" : "image" });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setLinkUrl("");
    setExistingUrl("");
    setPreviewFile(null);
    setUploadProgress(0);
    setIsFormOpen(false);
    setShowLinkGuide(false);
  };

  const handleDelete = async (id: string) => {
    confirmDelete("image", async () => {
      const loadingToast = toast.loading("Deleting...");
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete", { id: loadingToast });
      } else {
        toast.success("Deleted!", { id: loadingToast });
        fetchImages();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Please enter a title"); return; }

    if (!linkUrl.trim() && !existingUrl) {
      toast.error("Please enter a valid URL"); return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Saving...");
    const finalUrl = linkUrl.trim() || existingUrl;



    toast.loading(editingId ? "Saving changes..." : "Adding to gallery...", { id: loadingToast });
    const payload = { title: title.trim(), image_url: finalUrl, description: description.trim() };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("gallery").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("gallery").insert([payload]));
    }

    setIsSubmitting(false);
    setUploadProgress(0);

    if (error) {
      toast.error(`Failed to save: ${error.message}`, { id: loadingToast });
    } else {
      toast.success(editingId ? "Updated!" : "Added to gallery!", { id: loadingToast });
      resetForm();
      fetchImages();
    }
  };

  if (loading) return <div className="p-8 font-bold text-center">Loading gallery...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
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
          onClick={() => (isFormOpen ? resetForm() : setIsFormOpen(true))}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground neo-border neo-shadow-sm neo-press rounded-xl font-bold"
        >
          <Plus className={`w-5 h-5 transition-transform duration-300 ${isFormOpen ? "rotate-45" : ""}`} />
          {isFormOpen ? "Cancel" : "Add Media"}
        </button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="neo-border rounded-2xl p-6 bg-card space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold">{editingId ? "Edit Media" : "Add New Media"}</h2>

          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Winner of Tournament 2026"
                className="w-full neo-border rounded-lg px-3 py-2 bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a short caption or description..."
                className="w-full neo-border rounded-lg px-3 py-2 bg-background min-h-[80px]"
              />
            </div>
          </div>





          {/* URL INPUT */}
          <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-bold">Direct Link URL</label>
                  <button
                    type="button"
                    onClick={() => setShowLinkGuide(!showLinkGuide)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Info className="w-3.5 h-3.5" />
                    Cara dapat link?
                  </button>
                </div>
                <input
                  value={linkUrl}
                  onChange={(e) => handleLinkChange(e.target.value)}
                  placeholder="https://cdn.example.com/image.png"
                  className="w-full neo-border rounded-lg px-3 py-2 bg-background font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Harus berakhiran <code className="bg-muted px-1 rounded">.jpg</code> <code className="bg-muted px-1 rounded">.png</code> <code className="bg-muted px-1 rounded">.mp4</code> dll — link langsung ke filenya, bukan ke halaman website.
                </p>
              </div>

              {/* Link Guide */}
              {showLinkGuide && (
                <div className="neo-border rounded-xl bg-muted/50 p-4 space-y-4 text-sm">
                  <p className="font-bold text-base">📖 Panduan Cara Dapat Direct Link</p>

                  <div className="space-y-1.5">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                      Lewat Image Chest (Rekomendasi untuk foto)
                    </p>
                    <ol className="list-none space-y-1 pl-7 text-muted-foreground">
                      <li>→ Buka <a href="https://imgchest.com" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">imgchest.com <ExternalLink className="w-3 h-3" /></a></li>
                      <li>→ Upload foto kamu</li>
                      <li>→ Setelah upload, <strong className="text-foreground">klik kanan pada gambarnya</strong></li>
                      <li>→ Pilih <strong className="text-foreground">"Copy Image Address"</strong> (Salin Alamat Gambar)</li>
                      <li>→ Paste link-nya di kolom di atas ✅</li>
                    </ol>
                    <div className="pl-7 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Link yang benar contohnya: <code className="bg-muted px-1 rounded">https://cdn.imgchest.com/files/xxxxx.png</code>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                      Lewat Catbox (Rekomendasi untuk video)
                    </p>
                    <ol className="list-none space-y-1 pl-7 text-muted-foreground">
                      <li>→ Buka <a href="https://catbox.moe" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-1">catbox.moe <ExternalLink className="w-3 h-3" /></a></li>
                      <li>→ Upload video kamu (gratis, max 200MB)</li>
                      <li>→ Setelah selesai, <strong className="text-foreground">copy link yang muncul</strong></li>
                      <li>→ Paste di kolom di atas ✅</li>
                    </ol>
                    <div className="pl-7 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Link yang benar contohnya: <code className="bg-muted px-1 rounded">https://files.catbox.moe/xxxxxx.mp4</code>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-semibold flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                      Dari Discord
                    </p>
                    <ol className="list-none space-y-1 pl-7 text-muted-foreground">
                      <li>→ Upload foto/video ke channel Discord mana saja</li>
                      <li>→ <strong className="text-foreground">Klik kanan</strong> pada gambar/video yang sudah terupload</li>
                      <li>→ Pilih <strong className="text-foreground">"Copy Link"</strong></li>
                      <li>→ Paste di kolom di atas ✅</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          {previewFile && (
            <div className="rounded-xl overflow-hidden neo-border bg-muted max-h-64">
              {previewFile.type === "video"
                ? <video src={previewFile.url} controls muted className="w-full max-h-64 object-contain" />
                : <img src={previewFile.url} alt="Preview" className="w-full max-h-64 object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-accent text-accent-foreground font-bold neo-border rounded-xl disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Saving...</>
              ) : (
                editingId ? "Save Changes" : "Add to Gallery"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Gallery Grid */}
      {images.length === 0 ? (
        <div className="neo-border rounded-2xl p-12 bg-card text-center flex flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-bold text-lg">No media found</p>
          <p className="text-sm">Click &quot;Add Media&quot; to start filling up your community gallery.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {images.map((image) => (
            <div key={image.id} className="break-inside-avoid neo-border neo-shadow-sm rounded-2xl bg-card overflow-hidden flex flex-col relative group">
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => handleEditClick(image)} className="p-2 bg-background/90 backdrop-blur-sm neo-border hover:bg-muted rounded-lg transition-colors shadow-sm">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(image.id)} className="p-2 bg-background/90 backdrop-blur-sm neo-border text-danger hover:bg-danger/10 rounded-lg transition-colors shadow-sm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="relative w-full overflow-hidden bg-muted">
                {isVideo(image.image_url) ? (
                  <video src={image.image_url} autoPlay loop muted playsInline className="w-full h-auto object-cover" />
                ) : (
                  <Image
                    src={image.image_url}
                    alt={image.title}
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
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
