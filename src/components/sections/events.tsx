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
import { EventCard, EventRegistrationModal, ParticipantListModal } from "@/components/shared";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function Events() {
  const { t, language } = useTranslation();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fileData, setFileData] = useState<Record<string, File>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async (retryCount = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase.from("events").select("*").order("date", { ascending: false });
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (data) {
        setEvents(data);
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(`Error fetching events (attempt ${retryCount + 1}):`, err);
      if (retryCount < 2) {
        // Automatic retry after 1 second
        setTimeout(() => fetchEvents(retryCount + 1), 1000);
        return;
      }
      setError(err.message || "Failed to load events");
      setIsLoading(false);
    }
  };

  useEffect(() => {
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

      if (error) {
        if (error.code === '23505') {
          throw new Error("You have already registered for this event.");
        }
        throw error;
      }

      toast.success(language === "id" ? "Berhasil mendaftar! Menunggu persetujuan admin." : "Registration submitted! Waiting for admin approval.", { id: loadingToast });
      setIsModalOpen(false);
      setFormData({});
      setFileData({});
    } catch (error: any) {
      if (error.code !== '23505' && error.message !== "You have already registered for this event.") {
        console.error("Registration error:", error);
      }
      toast.error(error.message || (language === "id" ? "Registrasi gagal, coba lagi." : "Registration failed. Please try again."), { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterClick = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleCheckStatusClick = (event: any) => {
    setSelectedEvent(event);
    setIsStatusModalOpen(true);
  };

  // Limit and sort events for homepage
  const ongoingEvents = events
    .filter(e => e.type === "ongoing")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);
    
  const upcomingEvents = events
    .filter(e => e.type === "upcoming")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);
    
  const pastEvents = events
    .filter(e => e.type === "past")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

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
            {isLoading ? (
              <div className="lg:col-span-3 py-24 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground font-bold">{language === "id" ? "Memuat acara..." : "Loading events..."}</p>
              </div>
            ) : error ? (
              <div className="lg:col-span-3 py-20 flex flex-col items-center justify-center bg-danger/10 border-2 border-danger border-dashed rounded-2xl p-8 text-center">
                <p className="text-danger font-bold text-xl mb-4">{language === "id" ? "Gagal memuat acara" : "Failed to load events"}</p>
                <p className="text-foreground/80 mb-6 font-medium">{error}</p>
                <button 
                  onClick={() => fetchEvents(0)}
                  className="px-6 py-2 bg-background border-2 border-black rounded-lg font-bold neo-shadow-sm neo-press hover:bg-muted transition-colors"
                >
                  {language === "id" ? "Coba Lagi" : "Try Again"}
                </button>
              </div>
            ) : events.length === 0 ? (
              <div className="lg:col-span-3 py-24 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-2xl p-8 text-center bg-background/50">
                <Calendar className="w-16 h-16 text-muted-foreground mb-6 opacity-30" />
                <p className="text-foreground font-black text-2xl mb-2">{language === "id" ? "Belum Ada Acara" : "No Events Yet"}</p>
                <p className="text-muted-foreground font-medium">{language === "id" ? "Pantau terus Discord kami untuk info acara selanjutnya!" : "Stay tuned on our Discord for the next events!"}</p>
              </div>
            ) : (
              <>
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
                        {ongoingEvents.map(event => (
                          <EventCard key={event.id} event={event} type="ongoing" language={language} t={t} onRegisterClick={handleRegisterClick} onCheckStatusClick={handleCheckStatusClick} />
                        ))}
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
                    {upcomingEvents.map(event => (
                      <EventCard key={event.id} event={event} type="upcoming" language={language} t={t} onRegisterClick={handleRegisterClick} onCheckStatusClick={handleCheckStatusClick} />
                    ))}
                  </motion.div>
                  
                  <div className="pt-8">
                    <Link href="/events" className="inline-block w-full md:w-auto text-center px-8 py-3 neo-border neo-shadow-sm rounded-xl font-bold bg-background hover:bg-muted transition-colors neo-press">
                      {language === "id" ? "Lihat Semua Events ➔" : "View All Events ➔"}
                    </Link>
                  </div>
                </div>

                {/* Sidebar Column: Past Highlights */}
                <div className="lg:col-span-1 border-t lg:border-t-0 lg:border-l-4 border-dashed border-[var(--border)] pt-12 lg:pt-0 lg:pl-8">
                  <h3 className="font-extrabold text-2xl mb-8 flex items-center gap-3 text-foreground" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    <span className="w-3 h-3 rounded-full bg-muted-foreground"></span>
                    {t("events.past")}
                  </h3>
                  
                  <motion.div
                    className="flex flex-col gap-6"
                    variants={staggerContainer}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                  >
                    {pastEvents.map(event => (
                      <EventCard key={event.id} event={event} type="past" language={language} t={t} onRegisterClick={handleRegisterClick} onCheckStatusClick={handleCheckStatusClick} />
                    ))}
                  </motion.div>
                </div>
              </>
            )}
          </div>
        </div>
      </Section>

      {/* Registration Modal */}
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

      <ParticipantListModal 
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        selectedEvent={selectedEvent}
        language={language}
      />
    </>
  );
}
