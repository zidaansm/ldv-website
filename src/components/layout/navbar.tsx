"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MessageCircle, Globe } from "lucide-react";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/constants";
import { Container } from "./container";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { playClick } from "@/lib/sounds";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useTranslation();

  const scrollToElement = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const doScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          // Calculate absolute Y position.
          // By not subtracting the navbar height (offset 0), the top of the section
          // will slide UNDER the sticky navbar. Since sections have thick padding,
          // this perfectly hides the excess padding and brings the heading closer.
          const y = el.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      };

      doScroll();
      
      // Double check position after components have fetched their data and expanded
      setTimeout(doScroll, 800);
      
      return true;
    }
    return false;
  };

  useEffect(() => {
    // When pathname changes, reset or update activeHash
    const handleHashChange = () => {
      // Only care about hashes if we are on the homepage, 
      // or if the current URL actually has a hash
      if (pathname === "/") {
        const hash = window.location.hash;
        setActiveHash(hash);
        
        // If we just navigated to the homepage from another page and there's a hash,
        // we need to manually scroll to it because Next.js sometimes fails to do so.
        if (hash) {
          let attempts = 0;
          const tryScroll = () => {
            // In case of a malformed hash like #gallery#team, take the last one
            const hashes = hash.split('#').filter(Boolean);
            const id = hashes[hashes.length - 1];
            
            const success = scrollToElement(id);
            if (!success && attempts < 10) {
              attempts++;
              setTimeout(tryScroll, 100);
            }
          };
          // Start trying
          setTimeout(tryScroll, 100);
        }
      } else {
        setActiveHash(""); // Reset on other pages
      }
    };
    
    handleHashChange();
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Robust ScrollSpy logic based on element positions
      let currentSection = "";
      const scrollY = window.scrollY;
      // We check where each section is relative to the viewport
      NAV_LINKS.forEach((link) => {
        if (link.href.includes("#")) {
          const id = link.href.split("#")[1];
          const element = document.getElementById(id);
          if (element) {
            const rect = element.getBoundingClientRect();
            // If the top of the element is above the middle of the screen
            // and the bottom of the element is below the top of the screen
            if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= 0) {
              currentSection = id;
            }
          }
        }
      });

      if (currentSection) {
        setActiveHash(`#${currentSection}`);
      }
    };
    
    const handleHashChange = () => {
      if (pathname === "/") {
        setActiveHash(window.location.hash);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("hashchange", handleHashChange);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    playClick(); // Play sound on nav click
    // Only intercept if it's a hash link and we are on the homepage
    if (href.startsWith("/#") && pathname === "/") {
      e.preventDefault();
      e.stopPropagation();
      const id = href.split("#")[1];
      scrollToElement(id);
      window.history.replaceState(null, "", href);
      setActiveHash(`#${id}`);
    }
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "py-3 border-b-[3px] border-[var(--neo-border)]"
            : "py-5"
        )}
        style={{
          backgroundColor: isScrolled ? "rgba(248, 246, 242, 0.95)" : "transparent",
          backdropFilter: isScrolled ? "blur(8px)" : "none",
        }}
      >
        <Container>
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={(e) => {
                playClick();
                if (pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  router.push("/", { scroll: false });
                  setActiveHash("");
                }
              }}
              className="group flex items-center gap-3"
            >
              <div className="neo-border neo-shadow-sm neo-press rounded-xl px-4 py-2 bg-primary">
                <span
                  className="font-extrabold text-primary-foreground tracking-tighter text-xl"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  LDV
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                // If it's a hash link, check against activeHash AND ensure we are on the homepage.
                const isHashLink = link.href.includes('#');
                let isActive = false;
                
                if (isHashLink) {
                  const hash = link.href.substring(link.href.indexOf('#'));
                  // Only show hash links as active if we are actually on the homepage
                  isActive = pathname === "/" && activeHash === hash;
                } else {
                  isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={cn(
                      "relative px-4 py-2 text-sm font-bold transition-all rounded-lg border-2",
                      isActive
                        ? "text-foreground bg-secondary border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    )}
                  >
                    {t(`nav.${link.label.toLowerCase()}`)}
                  </Link>
                );
              })}
            </div>

            {/* Language Toggle & CTA (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => {
                  playClick();
                  setLanguage(language === "en" ? "id" : "en");
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm font-bold neo-border rounded-lg bg-card hover:bg-muted transition-colors"
                title="Toggle Language"
              >
                <Globe className="w-4 h-4" />
                <span>{language === "en" ? "EN" : "ID"}</span>
              </button>
              
              <a
                href={SITE_CONFIG.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playClick()}
                className="inline-flex items-center justify-center gap-2 neo-border neo-shadow-sm neo-press rounded-xl px-5 py-2.5 font-bold text-sm bg-primary text-primary-foreground transition-all hover:bg-primary/90"
              >
                <MessageCircle className="w-4 h-4" />
                {t("nav.joinDiscord")}
              </a>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => {
                playClick();
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className="md:hidden neo-border neo-shadow-sm neo-press rounded-xl p-2.5 bg-card text-foreground"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </Container>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden overflow-y-auto"
            style={{ backgroundColor: "rgba(248, 246, 242, 0.98)" }}
          >
            <div className="flex flex-col items-center justify-start min-h-screen gap-4 px-4 pt-28 pb-12">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.4,
                    ease: [0.19, 1, 0.22, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      handleNavClick(e, link.href);
                    }}
                    className="text-2xl font-extrabold text-foreground hover:text-primary transition-colors py-1"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {t(`nav.${link.label.toLowerCase()}`)}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Language Toggle */}
              <div className="mt-4 w-full max-w-[280px]">
                <button
                  onClick={() => {
                    playClick();
                    setLanguage(language === "en" ? "id" : "en");
                  }}
                  className="w-full flex items-center justify-center gap-2 neo-border neo-shadow-sm neo-press rounded-xl px-5 py-4 font-bold text-lg bg-card text-foreground transition-all hover:bg-muted"
                >
                  <Globe className="w-5 h-5" />
                  Language: {language === "en" ? "English" : "Indonesia"}
                </button>
              </div>

              {/* Mobile CTA */}
              <div className="mt-2 w-full max-w-[280px]">
                <a
                  href={SITE_CONFIG.discordInvite}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playClick()}
                  className="w-full inline-flex items-center justify-center gap-3 neo-border neo-shadow-sm neo-press rounded-xl px-5 py-4 font-bold text-lg bg-primary text-primary-foreground transition-all hover:bg-primary/90"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t("nav.joinDiscord")}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
