"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaGlobe, FaComment, FaGamepad, FaBox, FaXTwitter, FaTiktok, FaYoutube, FaSteam } from "react-icons/fa6";

type SocialLink = {
  id: string;
  platform: string;
  url: string;
  username: string | null;
  icon_name: string;
  order_index: number;
};

const renderIcon = (name: string, className = "w-6 h-6") => {
  switch (name) {
    case "twitter": return <FaXTwitter className={className} />;
    case "youtube": return <FaYoutube className={className} />;
    case "tiktok": return <FaTiktok className={className} />;
    case "message": return <FaComment className={className} />;
    case "gamepad": return <FaGamepad className={className} />;
    case "steam": return <FaSteam className={className} />;
    case "box": return <FaBox className={className} />;
    case "globe":
    default: return <FaGlobe className={className} />;
  }
};

export default function LinksPage() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const { data, error } = await supabase
          .from("social_links")
          .select("*")
          .eq("is_active", true)
          .order("order_index", { ascending: true });
        
        if (!error && data) {
          setLinks(data);
        }
      } catch (error) {
        console.error("Failed to fetch social links", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [supabase]);

  // Generate alternating neo-brutalist hover styles for buttons
  const getHoverStyle = (index: number) => {
    const styles = [
      "hover:bg-primary hover:text-primary-foreground",
      "hover:bg-secondary hover:text-secondary-foreground",
      "hover:bg-foreground hover:text-background"
    ];
    return styles[index % styles.length];
  };

  return (
    <main className="min-h-screen bg-background pt-24 pb-20 flex flex-col items-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-secondary/10 blur-3xl -z-10" />

      <div className="w-full max-w-2xl px-4 flex flex-col items-center">
        {/* Profile Header */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="flex flex-col items-center mb-12"
        >
          {/* Logo Container */}
          <div className="w-32 h-32 bg-primary rounded-full border-4 border-neo-border neo-shadow mb-6 flex items-center justify-center overflow-hidden relative">
            <Image 
              src="/logo-ldv.png" 
              alt="LDV Logo" 
              fill 
              className="object-contain p-4 drop-shadow-md"
              sizes="128px"
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-2 text-center" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Social Media
          </h1>
          <p className="text-lg font-bold text-muted-foreground text-center">
            Connect with La Dolce Vita across the internet.
          </p>
        </motion.div>

        {/* Links Container */}
        <div className="w-full space-y-4">
          {loading ? (
            // Loading Skeletons
            [...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="w-full h-20 bg-card border-4 border-neo-border rounded-xl animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))
          ) : links.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xl font-bold">No social links found.</p>
            </div>
          ) : (
            links.map((link, index) => (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1, type: "spring", stiffness: 100 }}
                className={`
                  group relative flex items-center w-full p-4 md:p-5 
                  bg-card border-4 border-neo-border rounded-2xl 
                  transition-all duration-300 ease-out
                  hover:-translate-y-2 hover:-translate-x-1 hover:neo-shadow-lg
                  ${getHoverStyle(index)}
                `}
              >
                {/* Icon Box */}
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center border-r-4 border-neo-border mr-4 pr-4 transition-colors duration-300 group-hover:border-current">
                  {renderIcon(link.icon_name)}
                </div>

                {/* Text Content */}
                <div className="flex flex-col">
                  <span className="text-xl md:text-2xl font-black uppercase tracking-wide">
                    {link.platform}
                  </span>
                  {link.username && (
                    <span className="text-sm font-bold opacity-80 mt-0.5">
                      {link.username}
                    </span>
                  )}
                </div>
              </motion.a>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
