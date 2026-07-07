"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Users, Trophy } from "lucide-react";
import { Section } from "@/components/layout";
import { SectionHeading } from "@/components/shared";
import { fadeInUp, staggerContainer, hoverLift } from "@/lib/animations";
import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import toast from "react-hot-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function Events() {
  const { t, language } = useTranslation();
  const [events, setEvents] = useState<any[]>([]);

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fileData, setFileData] = useState<Record<string, File>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase.from("events").select("*").order("date", { ascending: false });
      if (data) setEvents(data);
    }
    fetchEvents();
  }, []);

  const handleFileChange = (fieldLabel: string, file: File | null) => {
    if (file) {
      setFileData((prev) => ({ ...prev, [fieldLabel]: file }));
    } else {
      const newData = { ...fileData };
      delete newData[fieldLabel];
      setFileData(newData);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading(language === "id" ? "Memproses pendaftaran..." : "Processing registration...");

    try {
      let finalFormData = { ...formData };
      
      for (const [label, file] of Object.entries(fileData)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedEvent.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('event_uploads')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('event_uploads')
          .getPublicUrl(fileName);
          
        finalFormData[label] = publicUrl;
      }

      const { error } = await supabase.from("event_registrations").insert([
        {
          event_id: selectedEvent.id,
          form_data: finalFormData,
          status: "pending",
        }
      ]);

      if (error) throw error;

      toast.success(language === "id" ? "Berhasil mendaftar! Menunggu persetujuan admin." : "Registration submitted! Waiting for admin approval.", { id: loadingToast });
      setIsModalOpen(false);
      setFormData({});
      setFileData({});
    } catch (error) {
      console.error(error);
      toast.error(language === "id" ? "Registrasi gagal, coba lagi." : "Registration failed. Please try again.", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ongoingEvents = events.filter((e) => e.type === "ongoing");
  const upcomingEvents = events.filter((e) => e.type === "upcoming");
  const pastEvents = events.filter((e) => e.type === "past").slice(0, 3);

  const renderEventCard = (event: any, type: "upcoming" | "ongoing" | "past") => {
    const isUpcoming = type === "upcoming";
    const isOngoing = type === "ongoing";
    const isPast = type === "past";
    
    return (
    <motion.div
      key={event.id}
      variants={fadeInUp}
      whileHover={hoverLift}
      className={cn(
        "neo-border rounded-2xl p-6 bg-card flex flex-col h-full neo-hover",
        isOngoing ? "neo-shadow-danger border-danger/50" : isUpcoming ? "neo-shadow-primary" : "opacity-80 neo-shadow-sm"
      )}
      style={isPast ? { borderColor: "var(--muted-foreground)" } : undefined}
    >
      {/* Event Header: Category Badge & Status */}
      <div className="flex justify-between items-start mb-4">
        <span
          className="text-xs font-bold uppercase tracking-wider px-3 py-1 neo-border rounded-full"
          style={{
            backgroundColor: isOngoing ? "var(--danger)" : isUpcoming ? "var(--secondary)" : "var(--muted)",
            color: isOngoing ? "var(--danger-foreground)" : isUpcoming ? "var(--secondary-foreground)" : "var(--muted-foreground)",
          }}
        >
          {event.category}
        </span>
        
        {isOngoing ? (
          <span className="flex items-center gap-1.5 text-xs font-extrabold text-danger animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-danger"></span>
            </span>
            LIVE NOW
          </span>
        ) : isUpcoming ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            {t("events.upcoming")}
          </span>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {t("events.completed")}
          </span>
        )}
      </div>

      {/* Event Details */}
      <h3
        className="font-bold text-xl mb-2 text-foreground"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        {event.title}
      </h3>
      <p className="text-muted-foreground text-sm mb-6 flex-1">
        {event.description}
      </p>

      {/* Event Metadata (Date, Time, Participants) */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t-[2px] border-[var(--border)]">
        <div className="flex items-center gap-2 text-sm text-foreground font-medium">
          <Calendar className="w-4 h-4 text-primary" />
          {new Date(event.date).toLocaleDateString(language === "id" ? "id-ID" : "en-US", { month: "short", day: "numeric" })}
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground font-medium">
          <Clock className="w-4 h-4 text-primary" />
          {event.time}
        </div>
        <div className="col-span-2 flex items-center gap-2 text-sm text-foreground font-medium">
          <Users className="w-4 h-4 text-primary" />
          {event.participants} {isUpcoming || isOngoing ? t("events.registered") : t("events.participants")}
        </div>
      </div>
      
      {/* Join Button (Upcoming Only) */}
      {isUpcoming && (
        <button 
          disabled={event.is_closed}
          onClick={() => {
            setSelectedEvent(event);
            setIsModalOpen(true);
          }}
          className={cn(
            "block text-center w-full mt-6 neo-border neo-shadow-sm rounded-xl py-2.5 font-bold text-sm transition-colors",
            event.is_closed 
              ? "bg-muted text-muted-foreground cursor-not-allowed opacity-70"
              : "bg-primary text-primary-foreground hover:bg-primary/90 neo-press"
          )}
        >
          {event.is_closed ? (language === "id" ? "Pendaftaran Ditutup" : "Registration Closed") : "Register Now"}
        </button>
      )}

      {/* Live Button (Ongoing Only) */}
      {isOngoing && (
        <a 
          href={event.link || "#"}
          target="_blank"
          rel="noreferrer"
          className="block text-center w-full mt-6 neo-border neo-shadow-sm neo-press rounded-xl py-2.5 font-bold text-sm bg-danger text-danger-foreground hover:bg-danger/90 transition-colors"
        >
          {language === "id" ? "Gabung Live" : "Join Live"}
        </a>
      )}
    </motion.div>
  );

  return (
    <>
      <Section id="events" withPattern={false} className="bg-[var(--muted)]/30">
        <div className="space-y-16">
          <SectionHeading
            title={t("events.title")}
            subtitle={t("events.subtitle")}
            accentColor="pink"
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Column: Upcoming Events */}
            <div className="lg:col-span-2 space-y-6">
              {ongoingEvents.length > 0 && (
                <div className="mb-12 space-y-6">
                  <h3 className="font-extrabold text-2xl flex items-center gap-3 text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    <span className="w-3 h-3 rounded-full bg-danger animate-pulse"></span>
                    {language === "id" ? "Sedang Berlangsung" : "Live Now"}
                  </h3>  
                  <motion.div
                    className="grid md:grid-cols-2 gap-6"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                  >
                    {ongoingEvents.map(event => renderEventCard(event, "ongoing"))}
                  </motion.div>
                </div>
              )}

              <h3 className="font-extrabold text-2xl flex items-center gap-3 text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                <span className="w-3 h-3 rounded-full bg-secondary"></span>
                {t("events.upcoming")}
              </h3>  
              <motion.div
                className="grid md:grid-cols-2 gap-6"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                {upcomingEvents.map(event => renderEventCard(event, "upcoming"))}
              </motion.div>
            </div>

            {/* Sidebar Column: Past Events */}
            <div className="space-y-6">
              <h3 className="font-extrabold text-2xl flex items-center gap-3 text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                {t("events.pastHighlights")}
              </h3>
              
              <motion.div
                className="flex flex-col gap-6"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                {pastEvents.map(event => renderEventCard(event, "past"))}
              </motion.div>
            </div>
          </div>
        </div>
      </Section>

      {/* Registration Modal */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card neo-border neo-shadow-sm rounded-2xl p-6 md:p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-2">Register for {selectedEvent.title}</h2>
            <p className="text-muted-foreground text-sm mb-6">Please complete the following required information to register.</p>
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block font-bold text-sm mb-1">
                  Email Address <span className="text-danger">*</span>
                </label>
                <input 
                  required
                  type="email"
                  value={formData["email"] || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, "email": e.target.value }))}
                  className="w-full neo-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="your@email.com"
                />
              </div>
              {(selectedEvent.form_schema?.length ? selectedEvent.form_schema : [{ id: "discord_username", label: "Discord Username", type: "text", required: true }]).map((field: any) => (
                <div key={field.id}>
                  <label className="block font-bold text-sm mb-1">
                    {field.label} {field.required && <span className="text-danger">*</span>}
                  </label>
                  {field.type === "image" ? (
                    <input 
                      required={field.required}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(field.label, e.target.files?.[0] || null)}
                      className="w-full neo-border rounded-lg px-4 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                    />
                  ) : (
                    <input 
                      required={field.required}
                      type={field.type || "text"}
                      value={formData[field.label] || ""}
                      onChange={(e) => setFormData({ ...formData, [field.label]: e.target.value })}
                      className="w-full neo-border rounded-lg px-4 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold neo-border rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 font-bold neo-border rounded-xl bg-primary text-primary-foreground neo-press disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
