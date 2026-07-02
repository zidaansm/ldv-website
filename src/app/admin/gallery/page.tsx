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

type GalleryImage = {
  id: string;
  title: string;
  image_url: string;
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
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [showLinkGuide, setShowLinkGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Form State
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [existingUrl, setExistingUrl] = useState("");

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    const { data } = await supabase.from("gallery").select("*").order("created_at", { ascending: false });
    if (data) setImages(data);
    setLoading(false);
  };

  const handleFileSelect = (file: File) => {
    if (!fileSizeOk(file)) {
      const limit = file.type.startsWith("video") ? MAX_VIDEO_MB : MAX_IMAGE_MB;
      toast.error(`File too large! Max ${limit}MB for ${file.type.startsWith("video") ? "videos" : "images"}.`);
      return;
    }
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewFile({ url: objectUrl, type: file.type.startsWith("video") ? "video" : "image" });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
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
    setExistingUrl(image.image_url);
    setSelectedFile(null);
    setLinkUrl(image.image_url);
    setInputMode("link");
    setPreviewFile({ url: image.image_url, type: isVideo(image.image_url) ? "video" : "image" });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSelectedFile(null);
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

    if (inputMode === "link" && !linkUrl.trim() && !existingUrl) {
      toast.error("Please enter a valid URL"); return;
    }
    if (inputMode === "file" && !selectedFile && !existingUrl) {
      toast.error("Please select a file to upload"); return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Saving...");
    let finalUrl = inputMode === "link" ? linkUrl.trim() : existingUrl;

    if (inputMode === "file" && selectedFile) {
      toast.loading("Uploading file...", { id: loadingToast });
      const ext = selectedFile.name.split(".").pop();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setUploadProgress(15);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filename, selectedFile, { contentType: selectedFile.type, upsert: false });

      if (uploadError) {
        setIsSubmitting(false);
        setUploadProgress(0);
        toast.error(`Upload failed: ${uploadError.message}`, { id: loadingToast });
        return;
      }
      setUploadProgress(85);
      const { data: urlData } = supabase.storage.from("gallery").getPublicUrl(uploadData.path);
      finalUrl = urlData.publicUrl;
      setUploadProgress(100);
    }

    toast.loading(editingId ? "Saving changes..." : "Adding to gallery...", { id: loadingToast });
    const imageData = { title: title.trim(), image_url: finalUrl };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("gallery").update(imageData).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("gallery").insert([imageData]));
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

          {/* Title */}
          <div>
            <label className="block text-sm font-bold mb-1">Title / Caption</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Winner of Tournament 2026"
              className="w-full neo-border rounded-lg px-3 py-2 bg-background"
            />
          </div>

          {/* Mode Toggle */}
          <div>
            <label className="block text-sm font-bold mb-2">Source</label>
            <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
              <button
                type="button"
                onClick={() => { setInputMode("file"); setShowLinkGuide(false); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${inputMode === "file" ? "bg-card neo-border shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Upload className="w-4 h-4" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setInputMode("link")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${inputMode === "link" ? "bg-card neo-border shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Link2 className="w-4 h-4" />
                Paste Link
              </button>
            </div>
          </div>

          {/* FILE MODE */}
          {inputMode === "file" && (
            <div className="space-y-3">
              {/* Size info */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                <div>
                  <span className="font-semibold text-foreground">File size limits:</span>
                  <span className="ml-1">Images max <strong>{MAX_IMAGE_MB}MB</strong> · Videos max <strong>{MAX_VIDEO_MB}MB</strong></span>
                  <br />
                  <span>Supported: JPG, PNG, GIF, WEBP, MP4, MOV, WEBM</span>
                </div>
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 p-8 text-center
                  ${dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/60 hover:bg-muted/40"}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                />
                {selectedFile ? (
                  <div className="flex items-center gap-3 text-left w-full">
                    {selectedFile.type.startsWith("video")
                      ? <FileVideo className="w-10 h-10 text-primary shrink-0" />
                      : <ImageIcon className="w-10 h-10 text-primary shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold truncate">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB — click to change</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewFile(null); }}
                      className="p-1 rounded-full hover:bg-muted shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground" />
                    <div>
                      <p className="font-bold text-foreground">Drag & drop or click to upload</p>
                      <p className="text-sm text-muted-foreground mt-1">Images up to {MAX_IMAGE_MB}MB · Videos up to {MAX_VIDEO_MB}MB</p>
                    </div>
                  </>
                )}
              </div>

              {/* Progress */}
              {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Uploading...</span><span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-2 bg-primary rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LINK MODE */}
          {inputMode === "link" && (
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
                <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />{inputMode === "file" ? "Uploading..." : "Saving..."}</>
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
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-auto object-cover"
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
