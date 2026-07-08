"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Container } from "@/components/layout";
import { SectionHeading } from "@/components/shared";
import { staggerContainer, fadeInUp, hoverScale } from "@/lib/animations";
import { Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GalleryLightbox } from "@/components/shared/gallery-lightbox";

type GalleryImage = {
  id: string;
  title: string;
  image_url: string;
  description?: string;
};

function isVideo(url: string) {
  return !!(url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("mp4"));
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setImages(data);
      setLoading(false);
    };
    fetchImages();
  }, []);

  return (
    <div className="pt-32 pb-24 min-h-screen bg-background">
      <Container>
        <div className="mb-12">
          <Link href="/#gallery" className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground hover:text-foreground neo-border rounded-xl mb-8 font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <SectionHeading
            title="Hall of Memories"
            subtitle="Explore our full collection of community moments. From epic wins to hilarious fails."
            className="mb-0 max-w-3xl"
          />
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          {loading ? (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="break-inside-avoid bg-card neo-border rounded-2xl h-64 w-full" />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="neo-border rounded-2xl p-24 bg-card text-center flex flex-col items-center justify-center text-muted-foreground">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-bold text-xl">The gallery is waiting for memories.</p>
              <p className="text-sm mt-2">Check back later when we have added more photos.</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
              {images.map((img, index) => (
                <motion.div
                  key={img.id}
                  variants={fadeInUp}
                  whileHover="hover"
                  onClick={() => setActiveIndex(index)}
                  className="group cursor-pointer break-inside-avoid overflow-hidden rounded-2xl neo-border neo-shadow-sm relative bg-card mb-6"
                >
                  {isVideo(img.image_url) ? (
                    <motion.video
                      variants={{ hover: hoverScale }}
                      src={img.image_url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-auto object-cover"
                    />
                  ) : (
                    <motion.img
                      variants={{ hover: hoverScale }}
                      src={img.image_url}
                      alt={img.title}
                      loading="lazy"
                      className="w-full h-auto object-cover"
                      onError={(e) => (e.currentTarget.src = "https://placehold.co/600x800/png?text=Broken+Link")}
                    />
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <h3 className="text-white font-extrabold text-base translate-y-4 group-hover:translate-y-0 transition-transform duration-300 mb-2 drop-shadow-lg" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      {img.title}
                    </h3>
                    {isVideo(img.image_url) ? (
                      <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 w-fit">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-lg"
                          style={{
                            background: "#ef4444",
                            color: "white",
                            border: "2.5px solid white",
                            boxShadow: "3px 3px 0 0 white",
                            fontFamily: "var(--font-space-grotesk)",
                          }}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                          PLAY
                        </span>
                      </div>
                    ) : (
                      <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 w-fit">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-lg"
                          style={{
                            background: "var(--primary)",
                            color: "var(--primary-foreground)",
                            border: "2.5px solid white",
                            boxShadow: "3px 3px 0 0 white",
                            fontFamily: "var(--font-space-grotesk)",
                          }}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                          VIEW
                        </span>
                      </div>
                    )}
                  </div>

                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </Container>

      {/* Lightbox */}
      <GalleryLightbox
        items={images}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onPrev={() => setActiveIndex((i) => i !== null ? (i - 1 + images.length) % images.length : null)}
        onNext={() => setActiveIndex((i) => i !== null ? (i + 1) % images.length : null)}
      />
    </div>
  );
}
