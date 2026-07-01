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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function Events() {
  const { t, language } = useTranslation();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase.from("events").select("*").order("date", { ascending: false });
      if (data) setEvents(data);
    }
    fetchEvents();
  }, []);

  const upcomingEvents = events.filter((e) => e.type === "upcoming");
  const pastEvents = events.filter((e) => e.type === "past").slice(0, 3);

  const renderEventCard = (event: any, isUpcoming: boolean) => (
    <motion.div
      key={event.id}
      variants={fadeInUp}
      whileHover={hoverLift}
      className={cn(
        "neo-border rounded-2xl p-6 bg-card flex flex-col h-full neo-hover",
        isUpcoming ? "neo-shadow-primary" : "opacity-80 neo-shadow-sm"
      )}
      style={!isUpcoming ? { borderColor: "var(--muted-foreground)" } : undefined}
    >
      {/* Event Header: Category Badge & Status */}
      <div className="flex justify-between items-start mb-4">
        <span
          className="text-xs font-bold uppercase tracking-wider px-3 py-1 neo-border rounded-full"
          style={{
            backgroundColor: isUpcoming ? "var(--secondary)" : "var(--muted)",
            color: isUpcoming ? "var(--secondary-foreground)" : "var(--muted-foreground)",
          }}
        >
          {event.category}
        </span>
        
        {isUpcoming ? (
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
          {event.participants} {isUpcoming ? t("events.registered") : t("events.participants")}
        </div>
      </div>
      
      {/* Join Button (Upcoming Only) */}
      {isUpcoming && (
        <a 
          href={event.link || "#"} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block text-center w-full mt-6 neo-border neo-shadow-sm neo-press rounded-xl py-2.5 font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t("events.rsvp")}
        </a>
      )}
    </motion.div>
  );

  return (
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
              {upcomingEvents.map(event => renderEventCard(event, true))}
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
              {pastEvents.map(event => renderEventCard(event, false))}
            </motion.div>
          </div>
        </div>
      </div>
    </Section>
  );
}
