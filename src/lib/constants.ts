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
  discordInvite: "https://discord.gg/y4b33EGaM",
  githubUrl: "https://github.com/ldv-community",
} as const;

// ============================================
// NAVIGATION
// ============================================

export const NAV_LINKS: NavLink[] = [
  { label: "About", href: "/#about" },
  { label: "Events", href: "/#events" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Members", href: "/members" },
  { label: "Team", href: "/#team" },
  { label: "Menfess", href: "/menfess" },
  { label: "FAQ", href: "/#faq" },
];

// ============================================
// SOCIAL LINKS
// ============================================

export const SOCIAL_LINKS: SocialLink[] = [
  {
    name: "Discord",
    href: "https://discord.gg/y4b33EGaM",
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
