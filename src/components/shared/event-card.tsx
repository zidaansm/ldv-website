import { motion } from "framer-motion";
import { Calendar, Clock, Users } from "lucide-react";
import { fadeInUp, hoverLift } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: any;
  type: "upcoming" | "ongoing" | "past";
  language: "en" | "id";
  t: (key: string) => string;
  onRegisterClick: (event: any) => void;
}

export function EventCard({ event, type, language, t, onRegisterClick }: EventCardProps) {
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
          onClick={() => onRegisterClick(event)}
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
}
