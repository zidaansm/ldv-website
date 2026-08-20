import type { NavLink, SocialLink, CommunityStats } from "@/types";

// ============================================
// SITE METADATA
// ============================================

export const SITE_CONFIG = {
  name: "La Dolce Vita",
  shortName: "LDV",
  description:
    "A Discord community for socializing, gaming, and late-night grinds. Enjoy plenty of premium bots for free here. Come join us!",
  url: "https://ldv.gg",
  ogImage: "/og/og-default.png",
  discordInvite: "https://discord.gg/hhMtBmy5Cu",
  githubUrl: "https://github.com/ldv-community",
} as const;

// ============================================
// NAVIGATION
// ============================================

export const NAV_LINKS: NavLink[] = [
  { label: "About", href: "/#about" },
  { label: "Story", href: "/story" },
  { label: "Events", href: "/#events" },
  { label: "Members", href: "/members" },
  { label: "Bases", href: "/bases" },
  { label: "Collab", href: "/collaboration" },
  { label: "Socials", href: "/links" },
  { label: "Team", href: "/#team" },
];

// ============================================
// SOCIAL LINKS
// ============================================

export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: "Discord",
    href: "https://discord.gg/hhMtBmy5Cu",
    icon: "MessageCircle",
  },
  {
    name: "Twitter",
    href: "https://twitter.com/ldvarch",
    icon: "Hash",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@ldvarch",
    icon: "PlaySquare",
  },
];

// ============================================
// COMMUNITY STATS (Dummy)
// ============================================

export const COMMUNITY_STATS: CommunityStats = {
  members: 12847,
  online: 3421,
  events: 156,
  staff: 24,
};

// ============================================
// SECTION IDS
// ============================================

export const SECTION_IDS = {
  hero: "hero",
  about: "about",
  stats: "stats",
  events: "events",
  gallery: "gallery",
  team: "team",
  banlist: "banlist",
  faq: "faq",
  join: "join",
} as const;
