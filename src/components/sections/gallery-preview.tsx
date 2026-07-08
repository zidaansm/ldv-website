"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMediaQuery } from "@/hooks/use-media-query";
import { motion, AnimatePresence } from "framer-motion";
import { Section } from "@/components/layout";
import { SectionHeading } from "@/components/shared";
import { fadeInUp } from "@/lib/animations";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { GalleryLightbox } from "@/components/shared/gallery-lightbox";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type GalleryImage = {
  id: string;
  title: string;
  image_url: string;
  description?: string;
};

export function GalleryPreview() {
  const { t } = useTranslation();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const supabase = createClient();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const VISIBLE = isDesktop ? 4 : 2;

  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setImages(data);
      }
      setLoading(false);
    };

    fetchImages();
  }, []);

  // Get the currently visible cards using modular indexing (infinite loop)
  const getVisibleImages = useCallback(() => {
    if (images.length === 0) return [];
    const result: { image: GalleryImage; originalIndex: number }[] = [];
    for (let i = 0; i < Math.min(VISIBLE, images.length); i++) {
      const idx = (startIndex + i) % images.length;
      result.push({ image: images[idx], originalIndex: idx });
    }
    return result;
  }, [images, startIndex, VISIBLE]);

  const next = useCallback(() => {
    if (images.length <= VISIBLE) return;
    setDirection(1);
    setStartIndex((s) => (s + 1) % images.length);
  }, [images.length, VISIBLE]);

  const prev = useCallback(() => {
    if (images.length <= VISIBLE) return;
    setDirection(-1);
    setStartIndex((s) => (s - 1 + images.length) % images.length);
  }, [images.length, VISIBLE]);

  const visibleImages = getVisibleImages();

  return (
    <Section id="gallery" className="bg-muted">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <SectionHeading
          title={t("gallery.title")}
          subtitle={t("gallery.subtitle")}
          className="mb-0 text-left max-w-2xl"
        />
        <Link
          href="/gallery"
          className="hidden md:inline-flex items-center gap-2 px-6 py-3 font-bold text-foreground bg-card neo-border neo-shadow-sm neo-hover rounded-xl shrink-0"
        >
          {t("gallery.seeAll")}
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <motion.div
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: VISIBLE }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-card neo-border rounded-2xl" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="neo-border rounded-2xl p-12 bg-card text-center flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-bold text-lg">No moments shared yet</p>
            <p className="text-sm">The gallery is currently empty.</p>
          </div>
        ) : (
          <>
            {/* Cards Container */}
            <div className="relative py-4 md:py-8 px-2 md:px-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <AnimatePresence initial={false} mode="popLayout">
                  {visibleImages.map(({ image: img, originalIndex }) => {
                    const rotations = [-3, 2, -2, 3];
                    const rot = rotations[originalIndex % 4];
                    return (
                      <motion.div
                        key={img.id}
                        layout
                        initial={{
                          y: direction > 0 ? -40 : 40,
                          x: direction > 0 ? 40 : -40,
                          opacity: 0,
                          rotate: rot * 3,
                          scale: 1.1,
                        }}
                        animate={{
                          y: 0,
                          x: 0,
                          opacity: 1,
                          rotate: rot,
                          scale: 1,
                          transition: { type: "spring", stiffness: 600, damping: 25 },
                        }}
                        exit={{
                          y: direction > 0 ? 40 : -40,
                          x: direction > 0 ? -40 : 40,
                          opacity: 0,
                          scale: 0.9,
                          transition: { duration: 0.15 },
                        }}
                        whileHover={{
                          scale: 1.05,
                          rotate: 0,
                          zIndex: 10,
                          boxShadow: "8px 8px 0 var(--neo-border)",
                          transition: { type: "spring", stiffness: 400, damping: 15 }
                        }}
                        className="group relative bg-card p-3 md:p-4 pb-10 md:pb-14 flex flex-col aspect-[3/4] rounded-2xl border-[3px] border-[var(--neo-border)] cursor-pointer"
                        style={{ boxShadow: "4px 4px 0 var(--neo-border)" }}
                        onClick={() => {
                          const realIdx = images.indexOf(img);
                          setActiveIndex(realIdx);
                        }}
                      >
                        <div className="w-full flex-1 relative overflow-hidden rounded-xl border-2 border-[var(--neo-border)] bg-muted">
                          {!!(img.image_url.match(/\.(mp4|webm|ogg|mov)$/i) || img.image_url.includes("mp4")) ? (
                            <video
                              src={img.image_url}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <img
                              src={img.image_url}
                              alt={img.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) =>
                                (e.currentTarget.src =
                                  "https://placehold.co/400x530/png?text=Broken+Link")
                              }
                            />
                          )}
                        </div>

                        {/* Title Below Image (Polaroid style) */}
                        <div className="absolute bottom-2 md:bottom-4 left-0 right-0 text-center px-4">
                          <p className="text-foreground font-black text-sm md:text-base truncate" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                            {img.title}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            {/* Navigation Buttons */}
            {images.length > VISIBLE && (
              <div className="flex items-center justify-center gap-6 mt-8">
                <button
                  onClick={prev}
                  className="px-6 py-3 rounded-xl border-[3px] border-[var(--neo-border)] bg-card text-foreground font-black text-sm uppercase tracking-wider hover:bg-muted hover:-translate-y-1 transition-all active:translate-y-0"
                  style={{ boxShadow: "4px 4px 0 var(--neo-border)" }}
                >
                  Previous
                </button>
                <button
                  onClick={next}
                  className="px-6 py-3 rounded-xl border-[3px] border-[var(--neo-border)] bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider hover:-translate-y-1 transition-all active:translate-y-0"
                  style={{ boxShadow: "4px 4px 0 var(--neo-border)" }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 px-6 py-3 font-bold text-foreground bg-card neo-border neo-shadow-sm neo-press rounded-xl"
          >
            View Full Gallery
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>

      {/* Lightbox */}
      <GalleryLightbox
        items={images}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onPrev={() => setActiveIndex((i) => i !== null ? (i - 1 + images.length) % images.length : null)}
        onNext={() => setActiveIndex((i) => i !== null ? (i + 1) % images.length : null)}
      />
    </Section>
  );
}
