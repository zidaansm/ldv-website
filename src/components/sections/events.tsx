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
import { EventCard, EventRegistrationModal } from "@/components/shared";
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

  const handleRegisterClick = (event: any) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  // Limit events for homepage
  const ongoingEvents = events.filter(e => e.type === "ongoing").slice(0, 2);
  const upcomingEvents = events.filter(e => e.type === "upcoming").slice(0, 4);
  const pastEvents = events.filter(e => e.type === "past").slice(0, 3);

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
                    {ongoingEvents.map(event => (
                      <EventCard key={event.id} event={event} type="ongoing" language={language} t={t} onRegisterClick={handleRegisterClick} />
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
                  <EventCard key={event.id} event={event} type="upcoming" language={language} t={t} onRegisterClick={handleRegisterClick} />
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
                  <EventCard key={event.id} event={event} type="past" language={language} t={t} onRegisterClick={handleRegisterClick} />
                ))}
              </motion.div>
            </div>
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
    </>
  );
}
