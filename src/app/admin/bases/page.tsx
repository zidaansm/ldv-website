"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Plus, ArrowLeft, Edit2, X, Hash, Link as LinkIcon, Upload, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { confirmDelete } from "@/components/shared";

type TwitterBase = {
  id: string;
  handle: string;
  name: string;
  description: string;
  rules: string;
  logo_url: string;
  submit_link: string;
  created_at: string;
};

export default function BasesAdminPage() {
  const [bases, setBases] = useState<TwitterBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingBase, setEditingBase] = useState<TwitterBase | null>(null);

  // Form State
  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitLink, setSubmitLink] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchBases();
  }, []);

  const fetchBases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bases');
      if (res.ok) {
        const data = await res.json();
        setBases(data.bases);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to fetch bases");
      }
    } catch (e) {
      toast.error("An error occurred while fetching bases");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setHandle("");
    setName("");
    setDescription("");
    setRules("");
    setLogoUrl("");
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    setSubmitLink("");
    setEditingBase(null);
    setIsFormOpen(false);
  };

  const openEdit = (base: TwitterBase) => {
    setEditingBase(base);
    setHandle(base.handle || "");
    setName(base.name || "");
    setDescription(base.description || "");
    setRules(base.rules || "");
    setLogoUrl(base.logo_url || "");
    setPreviewUrl(base.logo_url || "");
    setSelectedFile(null);
    setSubmitLink(base.submit_link || "");
    setIsFormOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large! Maximum 5MB.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    confirmDelete(`Twitter Base "${name}"`, async () => {
      const loadingToast = toast.loading("Deleting base...");
      
      try {
        const res = await fetch(`/api/admin/bases?id=${id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          toast.success("Base deleted successfully!", { id: loadingToast });
          fetchBases();
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to delete base", { id: loadingToast });
        }
      } catch (e) {
        toast.error("An error occurred during deletion", { id: loadingToast });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!handle || !name) {
      toast.error("Handle and Name are required");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(editingBase ? "Updating base..." : "Creating base...");

    let finalLogoUrl = logoUrl;

    if (selectedFile) {
      toast.loading("Uploading logo to Cloudinary...", { id: loadingToast });
      setUploadProgress(20);

      try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
          throw new Error("Cloudinary credentials missing");
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("upload_preset", uploadPreset);

        const uploadResponse = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percentComplete);
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              resolve(response.secure_url);
            } else {
              reject(new Error(`Upload failed`));
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.send(formData);
        });

        finalLogoUrl = uploadResponse;
        setUploadProgress(100);
      } catch (err: any) {
        setIsSubmitting(false);
        setUploadProgress(0);
        toast.error(`Upload failed: ${err.message}`, { id: loadingToast });
        return;
      }
    }

    const payload = {
      id: editingBase?.id,
      handle,
      name,
      description,
      rules,
      logo_url: finalLogoUrl,
      submit_link: submitLink
    };

    try {
      const res = await fetch('/api/admin/bases', {
        method: editingBase ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingBase ? "Base updated!" : "Base created!", { id: loadingToast });
        resetForm();
        fetchBases();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Failed to save base", { id: loadingToast });
      }
    } catch (e) {
      toast.error("An error occurred while saving", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Twitter Bases
          </h1>
          <p className="text-muted-foreground mt-1 font-bold">
            Manage Twitter bases and their rules.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/admin"
            className="px-4 py-2 bg-secondary text-foreground font-bold neo-border neo-press rounded-xl flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors flex-1 sm:flex-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold neo-border neo-press rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            New Base
          </button>
        </div>
      </div>

      {isFormOpen && (
        <div className="bg-card neo-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6 border-b-2 border-black pb-4">
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary" />
              {editingBase ? "Edit Base" : "Add New Base"}
            </h2>
            <button
              onClick={resetForm}
              className="p-2 hover:bg-muted rounded-xl neo-press transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Handle (e.g. @base)</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-black bg-background font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                  placeholder="@thegamersbase"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Base Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-black bg-background font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                  placeholder="The Gamers Base"
                  required
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-bold mb-2">Base Logo</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {previewUrl ? (
                  <div className="relative inline-block border-2 border-black rounded-xl overflow-hidden bg-white neo-shadow-sm group">
                    <img src={previewUrl} alt="Preview" className="w-32 h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl("");
                        setLogoUrl("");
                      }}
                      className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">Remove</span>
                    </button>
                  </div>
                ) : logoUrl ? (
                  <div className="relative inline-block border-2 border-black rounded-xl overflow-hidden bg-white neo-shadow-sm group">
                    <img src={logoUrl} alt="Preview" className="w-32 h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl("");
                        setLogoUrl("");
                      }}
                      className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold">Remove</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-64 h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-black rounded-xl bg-muted hover:bg-secondary neo-press transition-colors"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm font-bold text-muted-foreground">Upload Logo (Cloudinary)</span>
                  </button>
                )}
                
                {uploadProgress > 0 && (
                  <div className="w-full sm:w-64 mt-2">
                    <div className="h-2 bg-muted rounded-full border border-black overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Submit Link (Optional)</label>
                <input
                  type="url"
                  value={submitLink}
                  onChange={(e) => setSubmitLink(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-black bg-background font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                  placeholder="https://secreto.site/..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-black bg-background font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all"
                placeholder="A short description of the base"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">Rules</label>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-xl border-2 border-black bg-background font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all mb-2"
                placeholder="1. No racism&#10;2. Be kind"
              />
              <div className="bg-muted neo-border rounded-xl p-3 text-xs font-medium space-y-1">
                <p className="font-bold mb-1">Markdown is supported:</p>
                <p><code># Heading 1</code> | <code>## Heading 2</code></p>
                <p><code>**Bold Text**</code> | <code>*Italic Text*</code></p>
                <p><code>- List item</code> | <code>1. Numbered list</code></p>
                <p><code>[Link Name](https://link.com)</code></p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-secondary text-foreground font-bold neo-border neo-press rounded-xl hover:bg-secondary/80 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-primary text-primary-foreground font-bold neo-border neo-press rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : editingBase ? "Update Base" : "Create Base"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-card neo-border rounded-xl w-full" />
          ))}
        </div>
      ) : bases.length === 0 ? (
        <div className="bg-card neo-border rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <Hash className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-bold">No bases found</h3>
          <p className="text-muted-foreground mt-2">Create a new base to display it on the public page.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bases.map((base) => (
            <div
              key={base.id}
              className="bg-card neo-border rounded-xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-extrabold text-lg flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      {base.name}
                    </h3>
                    <p className="text-sm font-bold text-muted-foreground">
                      {base.handle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(base)}
                      className="p-2 bg-secondary neo-border neo-press rounded-lg hover:bg-secondary/80 transition-colors"
                      title="Edit base"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(base.id, base.name)}
                      className="p-2 bg-[#ff4d4d] text-white neo-border neo-press rounded-lg hover:bg-[#ff4d4d]/90 transition-colors"
                      title="Delete base"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {base.description && (
                    <p className="text-sm font-bold bg-muted p-2 rounded-lg border-2 border-black line-clamp-2">
                      {base.description}
                    </p>
                  )}
                </div>
              </div>

              {base.submit_link && (
                <div className="pt-4 border-t-2 border-black flex items-center gap-2 text-sm font-bold text-primary">
                  <LinkIcon className="w-4 h-4" />
                  <a href={base.submit_link} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                    {base.submit_link}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
