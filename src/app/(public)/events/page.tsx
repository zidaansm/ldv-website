"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/animations";
import { EventCard, EventRegistrationModal, SectionHeading } from "@/components/shared";
import { cn } from "@/lib/utils";
import { Section } from "@/components/layout";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EventsGalleryPage() {
  const { t, language } = useTranslation();
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "ongoing" | "upcoming" | "past">("all");

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

  const filteredEvents = events.filter(e => filter === "all" || e.type === filter);

  // Split into categories if filter is "all" to organize them visually
  const ongoingEvents = filteredEvents
    .filter(e => e.type === "ongoing")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  const upcomingEvents = filteredEvents
    .filter(e => e.type === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
  const pastEvents = filteredEvents
    .filter(e => e.type === "past")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleRegisterClick = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

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
          .from('registration-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        finalFormData[label] = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]}/storage/v1/object/public/registration-files/${fileName}`;
      }

      const { error: insertError } = await supabase.from("event_registrations").insert([{
        event_id: selectedEvent.id,
        email: formData.email,
        form_data: finalFormData,
        status: "pending"
      }]);

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error("You have already registered for this event with this email.");
        }
        throw insertError;
      }

      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "registration_received",
          email: formData.email,
          eventTitle: selectedEvent.title
        })
      });

      toast.success(language === "id" ? "Berhasil mendaftar!" : "Successfully registered!", { id: loadingToast });
      setIsModalOpen(false);
      setFormData({});
      setFileData({});
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to register.", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-20 bg-[var(--background)]">
      <Section id="events-gallery" withPattern={false} className="bg-transparent">
        <div className="space-y-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                {language === "id" ? "Kembali ke Beranda" : "Back to Home"}
              </Link>
              <SectionHeading
                title={language === "id" ? "Galeri Acara" : "Events Gallery"}
                subtitle={language === "id" ? "Telusuri seluruh acara LDV yang sedang berjalan, akan datang, maupun yang sudah berlalu." : "Browse all ongoing, upcoming, and past LDV events."}
                accentColor="pink"
                align="left"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {[
                { id: "all", label: language === "id" ? "Semua" : "All" },
                { id: "ongoing", label: language === "id" ? "Sedang Berjalan (LIVE)" : "Live Now" },
                { id: "upcoming", label: language === "id" ? "Akan Datang" : "Upcoming" },
                { id: "past", label: language === "id" ? "Sudah Berlalu" : "Past" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-bold text-sm transition-all neo-border neo-press",
                    filter === tab.id 
                      ? "bg-primary text-primary-foreground neo-shadow-sm" 
                      : "bg-card text-foreground hover:bg-muted"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-16">
            {(filter === "all" || filter === "ongoing") && ongoingEvents.length > 0 && (
              <div className="space-y-6">
                <h3 className="font-extrabold text-3xl flex items-center gap-3 text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  <span className="w-4 h-4 rounded-full bg-danger animate-pulse"></span>
                  {language === "id" ? "Sedang Berlangsung" : "Live Now"}
                </h3>
                <motion.div
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                >
                  {ongoingEvents.map(event => (
                    <EventCard key={event.id} event={event} type="ongoing" language={language} t={t} onRegisterClick={handleRegisterClick} />
                  ))}
                </motion.div>
              </div>
            )}

            {(filter === "all" || filter === "upcoming") && upcomingEvents.length > 0 && (
              <div className="space-y-6">
                <h3 className="font-extrabold text-3xl flex items-center gap-3 text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  <span className="w-4 h-4 rounded-full bg-secondary"></span>
                  {t("events.upcoming")}
                </h3>
                <motion.div
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                >
                  {upcomingEvents.map(event => (
                    <EventCard key={event.id} event={event} type="upcoming" language={language} t={t} onRegisterClick={handleRegisterClick} />
                  ))}
                </motion.div>
              </div>
            )}

            {(filter === "all" || filter === "past") && pastEvents.length > 0 && (
              <div className="space-y-6">
                <h3 className="font-extrabold text-3xl flex items-center gap-3 text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  <span className="w-4 h-4 rounded-full bg-muted-foreground"></span>
                  {t("events.past")}
                </h3>
                <motion.div
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                >
                  {pastEvents.map(event => (
                    <EventCard key={event.id} event={event} type="past" language={language} t={t} onRegisterClick={handleRegisterClick} />
                  ))}
                </motion.div>
              </div>
            )}

            {filteredEvents.length === 0 && (
              <div className="text-center py-20 neo-border rounded-2xl bg-card border-dashed">
                <p className="text-muted-foreground font-bold text-lg">
                  {language === "id" ? "Belum ada acara di kategori ini." : "No events found in this category."}
                </p>
              </div>
            )}
          </div>
        </div>
      </Section>

      <EventRegistrationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedEvent={selectedEvent}
        formData={formData}
        setFormData={setFormData}
        handleFileChange={handleFileChange}
        onSubmit={handleRegister}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
