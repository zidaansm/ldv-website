"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Section } from "@/components/layout";
import { SectionHeading } from "@/components/shared";
import { fadeInUp } from "@/lib/animations";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageContext";

type GalleryImage = {
  id: string;
  title: string;
  image_url: string;
};

export function GalleryPreview() {
  const { t } = useTranslation();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [startIndex, setStartIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const supabase = createClient();

  const VISIBLE = 4;

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
  }, [images, startIndex]);

  const next = useCallback(() => {
    if (images.length <= VISIBLE) return;
    setDirection(1);
    setStartIndex((s) => (s + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    if (images.length <= VISIBLE) return;
    setDirection(-1);
    setStartIndex((s) => (s - 1 + images.length) % images.length);
  }, [images.length]);

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
            {[1, 2, 3, 4].map((i) => (
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
            <div className="relative overflow-hidden rounded-2xl neo-border bg-foreground p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <AnimatePresence initial={false} mode="popLayout">
                  {visibleImages.map(({ image: img, originalIndex }) => (
                    <motion.div
                      key={img.id}
                      layout
                      initial={{
                        x: direction > 0 ? 100 : -100,
                        opacity: 0,
                      }}
                      animate={{
                        x: 0,
                        opacity: 1,
                        transition: { type: "spring", stiffness: 400, damping: 30 },
                      }}
                      exit={{
                        x: direction > 0 ? -100 : 100,
                        opacity: 0,
                        transition: { duration: 0.2 },
                      }}
                      className="group relative aspect-[3/4] overflow-hidden rounded-xl border-2 border-primary/30 hover:border-primary transition-colors duration-300 cursor-pointer"
                    >
                      {img.image_url.match(/\.(mp4|webm|ogg)$/i) ||
                      img.image_url.includes("mp4") ? (
                        <video
                          src={img.image_url}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <img
                          src={img.image_url}
                          alt={img.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://placehold.co/400x530/png?text=Broken+Link")
                          }
                        />
                      )}

                      {/* Title Overlay */}
                      <div className="absolute top-0 left-0 right-0 p-3 md:p-4">
                        <p className="text-white/80 text-xs md:text-sm font-semibold truncate drop-shadow-lg">
                          {img.title}
                        </p>
                      </div>

                      {/* Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Navigation Buttons */}
            {images.length > VISIBLE && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={prev}
                  className="px-6 py-2.5 rounded-full neo-border neo-shadow-sm neo-press bg-card text-foreground font-semibold text-sm hover:bg-muted transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={next}
                  className="px-6 py-2.5 rounded-full neo-border neo-shadow-sm neo-press bg-primary text-primary-foreground font-semibold text-sm"
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
    </Section>
  );
}
