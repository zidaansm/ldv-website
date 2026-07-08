"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Plus, ArrowLeft, Edit2, HelpCircle } from "lucide-react";
import Link from "next/link";
import { logAdminAction } from "@/lib/admin-logger";
import toast from "react-hot-toast";
import { confirmDelete } from "@/components/shared";

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

export default function FAQAdminPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const supabase = createClient();

  // Form State
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    const { data } = await supabase.from("faq").select("*").order("created_at", { ascending: true });
    if (data) setFaqs(data);
    setLoading(false);
  };

  const handleEditClick = (faq: FAQ) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    confirmDelete("FAQ", async () => {
      const loadingToast = toast.loading("Deleting FAQ...");
      const faqToDelete = faqs.find(f => f.id === id);
      const { error } = await supabase.from("faqs").delete().eq("id", id);
      
      if (error) {
        toast.error("Failed to delete FAQ", { id: loadingToast });
      } else {
        logAdminAction("Deleted FAQ", `FAQ: ${faqToDelete?.question || id}`);
        toast.success("FAQ deleted successfully!", { id: loadingToast });
        fetchFaqs();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading(editingId ? "Updating FAQ..." : "Creating FAQ...");
    
    const faqData = { question, answer };
    
    let error;
    if (editingId) {
      const res = await supabase.from("faq").update(faqData).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("faq").insert([faqData]);
      error = res.error;
    }

    setIsSubmitting(false);

    if (error) {
      toast.error(`Failed to ${editingId ? "update" : "create"} FAQ`, { id: loadingToast });
    } else {
      logAdminAction(editingId ? "Updated FAQ" : "Created FAQ", `FAQ: ${question}`);
      toast.success(`FAQ ${editingId ? "updated" : "created"} successfully!`, { id: loadingToast });
      resetForm();
      fetchFaqs();
    }
  };

  if (loading) return <div className="p-8 font-bold text-center">Loading FAQ...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl neo-border bg-card hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            FAQ Management
          </h1>
        </div>
        <button
          onClick={() => isFormOpen ? resetForm() : setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground neo-border neo-shadow-sm neo-press rounded-xl font-bold"
        >
          <Plus className={`w-5 h-5 transition-transform ${isFormOpen ? "rotate-45" : ""}`} />
          {isFormOpen ? "Cancel" : "Add FAQ"}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="neo-border rounded-2xl p-6 bg-card space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold mb-4">{editingId ? "Edit FAQ" : "Add New FAQ"}</h2>
          <div>
            <label className="block text-sm font-bold mb-1">Question</label>
            <input required value={question} onChange={e => setQuestion(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Answer</label>
            <textarea required value={answer} onChange={e => setAnswer(e.target.value)} className="w-full neo-border rounded-lg px-3 py-2 bg-background h-32" />
          </div>
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-accent text-accent-foreground font-bold neo-border rounded-xl disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save FAQ"}
            </button>
          </div>
        </form>
      )}

      {faqs.length === 0 ? (
        <div className="neo-border rounded-2xl p-12 bg-card text-center flex flex-col items-center justify-center text-muted-foreground">
          <HelpCircle className="w-12 h-12 mb-4 opacity-50" />
          <p className="font-bold text-lg">No FAQs found</p>
          <p className="text-sm">Click "Add FAQ" to start answering common questions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="neo-border neo-shadow-sm rounded-2xl bg-card p-6 relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditClick(faq)} className="p-2 bg-background neo-border hover:bg-muted rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(faq.id)} className="p-2 bg-background neo-border text-danger hover:bg-danger/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold mb-2 pr-20">{faq.question}</h3>
              <p className="text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
