"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Plus, ArrowLeft, Edit2, CalendarX2, Users, Search } from "lucide-react";
import Link from "next/link";
import { logAdminAction } from "@/lib/admin-logger";
import toast from "react-hot-toast";
import { confirmDelete } from "@/components/shared";

type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  category: string;
  type: "upcoming" | "ongoing" | "past";
  participants: number;
  link?: string;
  announcement?: string;
  form_schema?: any[];
  is_closed?: boolean;
};

type FormField = { id: string, label: string, type: string, required: boolean };
const defaultSchema: FormField[] = [{ id: "discord_username", label: "Discord Username", type: "text", required: true }];

export default function EventsAdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClient();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("");
  const [link, setLink] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [type, setType] = useState<"upcoming" | "ongoing" | "past">("upcoming");
  const [participants, setParticipants] = useState<number>(0);
  const [isClosed, setIsClosed] = useState(false);
  const [formSchema, setFormSchema] = useState<FormField[]>(defaultSchema);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("*");
    if (data) {
      const ongoing = data.filter(e => e.type === "ongoing").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const upcoming = data.filter(e => e.type === "upcoming").sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const past = data.filter(e => e.type === "past").sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setEvents([...ongoing, ...upcoming, ...past]);
    }
    setLoading(false);
  };

  const handleEditClick = (event: Event) => {
    setEditingId(event.id);
    setTitle(event.title);
    setDescription(event.description);
    setDate(event.date);
    setTime(event.time);
    setCategory(event.category);
    setLink(event.link || "");
    setAnnouncement(event.announcement || "");
    setType(event.type);
    setParticipants(event.participants || 0);
    setIsClosed(event.is_closed || false);
    setFormSchema(event.form_schema?.length ? event.form_schema : defaultSchema);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setCategory("");
    setLink("");
    setAnnouncement("");
    setType("upcoming");
    setParticipants(0);
    setIsClosed(false);
    setFormSchema(defaultSchema);
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    confirmDelete("event", async () => {
      const loadingToast = toast.loading("Deleting event...");
      const eventToDelete = events.find(e => e.id === id);
      const { error } = await supabase.from("events").delete().eq("id", id);
      
      if (error) {
        toast.error("Failed to delete event", { id: loadingToast });
      } else {
        logAdminAction("Deleted Event", `Deleted event: ${eventToDelete?.title || id}`);
        toast.success("Event deleted successfully!", { id: loadingToast });
        fetchEvents();
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingToast = toast.loading(editingId ? "Updating event..." : "Creating event...");
    
    const eventData = { title, description, date, time, category, type, link, announcement, participants, form_schema: formSchema, is_closed: isClosed };
    
    let error;
    if (editingId) {
      const res = await supabase.from("events").update(eventData).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("events").insert([eventData]);
      error = res.error;
    }

    setIsSubmitting(false);

    if (error) {
      toast.error(`Failed to ${editingId ? "update" : "create"} event`, { id: loadingToast });
    } else {
      logAdminAction(editingId ? "Updated Event" : "Created Event", `Event title: ${title}`);
      toast.success(`Event ${editingId ? "updated" : "created"} successfully!`, { id: loadingToast });
      resetForm();
      fetchEvents();
    }
  };

  if (loading) return <div className="p-8 font-bold text-center">Loading events...</div>;

  const filteredEvents = events.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl bg-background border border-border/50 hover:bg-muted transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Events Management
          </h1>
        </div>
        <button
          onClick={() => isFormOpen ? resetForm() : setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:-translate-y-0.5 rounded-xl font-semibold transition-all"
        >
          <Plus className={`w-5 h-5 transition-transform ${isFormOpen ? "rotate-45" : ""}`} />
          {isFormOpen ? "Cancel" : "New Event"}
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search events by title, category, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-border/50 shadow-sm rounded-xl pl-10 pr-4 py-3 bg-card focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="border border-border/50 shadow-sm rounded-2xl p-6 bg-card/50 backdrop-blur-md space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Event" : "Create New Event"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Title</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Category (e.g. Gaming, Social)</label>
              <input required value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Date</label>
              <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Time</label>
              <input required type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value as any)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing (LIVE)</option>
                <option value="past">Past</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Registered Participants</label>
              <input required type="number" min="0" value={participants} onChange={e => setParticipants(parseInt(e.target.value) || 0)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Discord Message Link (Optional)</label>
              <input type="url" placeholder="https://discord.com/channels/..." value={link} onChange={e => setLink(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Description</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-border/50 rounded-lg px-3 py-2 bg-background h-24 focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1 text-danger">Event Announcement (Optional)</label>
              <textarea placeholder="e.g. Bracket is up! Check discord..." value={announcement} onChange={e => setAnnouncement(e.target.value)} className="w-full border border-danger/50 rounded-lg px-3 py-2 bg-danger/5 text-foreground h-20 placeholder:text-danger/50 focus:border-danger focus:ring-1 focus:ring-danger transition-all" />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 p-4 bg-danger/5 border border-danger/20 rounded-xl">
              <input 
                type="checkbox" 
                id="is_closed" 
                checked={isClosed} 
                onChange={e => setIsClosed(e.target.checked)} 
                className="w-5 h-5 accent-danger rounded cursor-pointer" 
              />
              <div>
                <label htmlFor="is_closed" className="font-semibold text-danger block cursor-pointer">Close Registration</label>
                <p className="text-sm text-danger/80">Check this box to lock the event and prevent any new users from registering.</p>
              </div>
            </div>
            <div className="md:col-span-2 space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Registration Form Builder</h3>
                  <p className="text-sm text-muted-foreground">Define custom questions for attendees when registering.</p>
                </div>
                <button type="button" onClick={() => setFormSchema([...formSchema, { id: `field_${Date.now()}`, label: "New Field", type: "text", required: false }])} className="text-sm px-4 py-2 bg-secondary text-secondary-foreground shadow-sm shadow-secondary/20 hover:-translate-y-0.5 rounded-xl font-semibold transition-all">Add Question</button>
              </div>
              {formSchema.map((field, index) => (
                <div key={field.id} className="flex items-center gap-4 p-4 border border-border/50 rounded-xl bg-muted/30">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question Label</label>
                    <input value={field.label} onChange={(e) => {
                      const newSchema = [...formSchema];
                      newSchema[index].label = e.target.value;
                      setFormSchema(newSchema);
                    }} className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background font-medium focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  </div>
                  <div className="w-32 space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</label>
                    <select value={field.type} onChange={(e) => {
                      const newSchema = [...formSchema];
                      newSchema[index].type = e.target.value;
                      setFormSchema(newSchema);
                    }} className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background font-medium focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                      <option value="text">Text</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input type="checkbox" id={`req_${field.id}`} checked={field.required} onChange={(e) => {
                      const newSchema = [...formSchema];
                      newSchema[index].required = e.target.checked;
                      setFormSchema(newSchema);
                    }} className="w-5 h-5 accent-primary cursor-pointer rounded" />
                    <label htmlFor={`req_${field.id}`} className="text-sm font-semibold cursor-pointer">Required</label>
                  </div>
                  <button type="button" onClick={() => {
                    setFormSchema(formSchema.filter((_, i) => i !== index));
                  }} className="mt-6 p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-accent text-accent-foreground font-semibold shadow-md shadow-accent/20 hover:-translate-y-0.5 rounded-xl disabled:opacity-50 transition-all"
            >
              {isSubmitting ? "Saving..." : "Save Event"}
            </button>
          </div>
        </form>
      )}

      <div className="border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card/50 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-6 py-4 font-bold text-sm text-foreground">{event.title}</td>
                  <td className="px-6 py-4 font-medium text-sm text-muted-foreground">{event.date} | {event.time}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-md text-xs font-semibold uppercase tracking-wider">{event.category}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-sm">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border ${
                      event.type === 'ongoing' ? 'bg-success/10 text-success border-success/20' : 
                      event.type === 'upcoming' ? 'bg-primary/10 text-primary border-primary/20' : 
                      'bg-muted text-muted-foreground border-border/50'
                    }`}>
                      {event.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        href={`/admin/events/${event.id}`}
                        className="p-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                        title="Manage Registrants"
                      >
                        <Users className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleEditClick(event)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(event.id)} className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <CalendarX2 className="w-12 h-12 mb-4 opacity-50" />
                      <p className="font-bold text-lg">No events found</p>
                      <p className="text-sm">Click "New Event" to create your first community event.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
