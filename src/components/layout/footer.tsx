"use client";

import Link from "next/link";
import {
  MessageCircle,
  Globe,
  Hash,
  PlaySquare,
  Heart,
} from "lucide-react";
import { NAV_LINKS, SOCIAL_LINKS, SITE_CONFIG } from "@/lib/constants";
import { Container } from "./container";
import { useTranslation } from "@/lib/i18n/LanguageContext";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageCircle,
  Hash,
  PlaySquare,
};

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative border-t-[3px] border-[var(--neo-border)]"
      style={{ backgroundColor: "var(--card)" }}
    >
      <Container>
        <div className="py-16">
          {/* Top: Logo + Socials */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
            {/* Logo */}
            <div className="space-y-3">
              <div className="neo-border neo-shadow-sm rounded-xl px-4 py-2 bg-primary inline-block">
                <span
                  className="font-extrabold text-primary-foreground tracking-tighter text-xl"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  LDV
                </span>
              </div>
              <p className="text-muted-foreground text-sm max-w-xs">
                La Dolce Vita — The sweetest community on Discord.
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = iconMap[social.icon];
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.name}
                    className="neo-border neo-shadow-sm neo-press rounded-xl p-3 bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {Icon ? (
                      <Icon className="w-5 h-5" />
                    ) : (
                      <Globe className="w-5 h-5" />
                    )}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Middle: Navigation Links */}
          <div className="border-t-[2px] border-[var(--border)] pt-8 mb-8">
            <div className="flex flex-wrap gap-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                >
                  {t(`nav.${link.label.toLowerCase()}`)}
                </Link>
              ))}
              <Link
                href="#banlist"
                className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                {t("banlist.title")}
              </Link>
            </div>
          </div>

          {/* Bottom: Copyright */}
          <div className="border-t-[2px] border-[var(--border)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} {SITE_CONFIG.name}. {t("footer.rights")}
            </p>

          </div>
        </div>
      </Container>
    </footer>
  );
}
