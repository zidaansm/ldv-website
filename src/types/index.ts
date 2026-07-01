// ============================================
// LDV WEBSITE — Shared Type Definitions
// ============================================

export interface NavLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface SocialLink {
  name: string;
  href: string;
  icon: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  socials?: SocialLink[];
  accentColor?: "purple" | "pink" | "cyan" | "success" | "warning";
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  type: "upcoming" | "past";
  category: "gaming" | "social" | "tournament" | "community" | "special";
  image?: string;
  participants?: number;
}

export interface CommunityStats {
  members: number;
  online: number;
  events: number;
  staff: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface BanEntry {
  id: string;
  username: string;
  reason: string;
  date: string;
  duration: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt: string;
  category?: "events" | "community" | "gaming" | "memes";
  width: number;
  height: number;
}

export interface SectionProps {
  id?: string;
  className?: string;
}
