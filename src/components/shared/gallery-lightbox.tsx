"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useFocusTrap } from "@/hooks/use-focus-trap";

type GalleryItem = {
  id: string;
  title: string;
  image_url: string;
  description?: string;
};

type Props = {
  items: GalleryItem[];
  activeIndex: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

function isVideo(url: string) {
  return !!(url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("mp4"));
}

export function GalleryLightbox({ items, activeIndex, onClose, onPrev, onNext }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isOpen = activeIndex !== null;
  const item = activeIndex !== null ? items[activeIndex] : null;

  const modalRef = useFocusTrap(isOpen, onClose);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose, onPrev, onNext]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Play video with sound when lightbox opens
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => {});
    }
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {isOpen && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
          onClick={onClose}
        >
          {/* Backdrop — dotted cream like site background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: "rgba(20, 10, 5, 0.88)",
              backgroundImage: "radial-gradient(circle, rgba(248,246,242,0.06) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Main Card — neobrutalism style */}
          <motion.div
            ref={modalRef as React.RefObject<HTMLDivElement>}
            role="dialog"
            aria-modal="true"
            aria-label="Image gallery fullscreen view"
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative z-10 w-full max-w-3xl outline-none"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            {/* Neo card container */}
            <div
              className="bg-[var(--background)] rounded-3xl overflow-hidden"
              style={{
                border: "3px solid var(--foreground)",
                boxShadow: "8px 8px 0 0 var(--foreground)",
              }}
            >
              {/* Title bar — dark strip like neo headers */}
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: "3px solid var(--foreground)", backgroundColor: "var(--foreground)" }}
              >
                <div className="flex items-center gap-3">
                  {/* Traffic light dots */}
                  <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-black" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-black" />
                  <span className="w-3 h-3 rounded-full bg-green-500 border-2 border-black" />
                  <p
                    className="text-sm font-extrabold ml-2 truncate text-background"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {item.title}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Counter badge */}
                  {items.length > 1 && (
                    <span
                      className="text-xs font-extrabold px-2.5 py-1 rounded-lg"
                      style={{
                        background: "var(--primary)",
                        color: "var(--primary-foreground)",
                        border: "2px solid var(--background)",
                      }}
                    >
                      {activeIndex! + 1} / {items.length}
                    </span>
                  )}
                  <button
                    onClick={onClose}
                    aria-label="Close gallery"
                    className="p-1.5 rounded-xl font-bold transition-all hover:scale-95"
                    style={{
                      background: "var(--primary)",
                      color: "var(--primary-foreground)",
                      border: "2px solid var(--background)",
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description area */}
              {item.description && (
                <div
                  className="px-5 py-3 bg-background"
                  style={{ borderBottom: "3px solid var(--foreground)" }}
                >
                  <p className="text-sm font-medium text-foreground whitespace-pre-wrap">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Media area */}
              <div className="relative bg-muted flex items-center justify-center w-full h-[60vh]">
                {isVideo(item.image_url) ? (
                  <video
                    ref={videoRef}
                    key={item.id}
                    src={item.image_url}
                    controls
                    autoPlay
                    loop
                    aria-label={item.title || "Gallery video"}
                    className="w-full max-h-[60vh] object-contain"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <Image
                    key={item.id}
                    src={item.image_url}
                    alt={item.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-contain"
                  />
                )}

                {/* Prev Button */}
                {items.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onPrev(); }}
                      aria-label="Previous media"
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl font-extrabold transition-all hover:-translate-x-0.5 hover:translate-y-[-52%] active:translate-x-0"
                      style={{
                        background: "var(--background)",
                        border: "3px solid var(--foreground)",
                        boxShadow: "3px 3px 0 0 var(--foreground)",
                      }}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onNext(); }}
                      aria-label="Next media"
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl font-extrabold transition-all hover:translate-x-0.5 hover:translate-y-[-52%] active:translate-x-0"
                      style={{
                        background: "var(--background)",
                        border: "3px solid var(--foreground)",
                        boxShadow: "3px 3px 0 0 var(--foreground)",
                      }}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Bottom strip — hint text */}
              <div
                className="flex items-center justify-between px-5 py-2.5"
                style={{ borderTop: "3px solid var(--foreground)" }}
              >
                <p className="text-xs font-bold text-muted-foreground">
                  {isVideo(item.image_url) ? "🔊 Playing with sound" : "🖼️ Press ← → to navigate"}
                </p>
                <p className="text-xs font-bold text-muted-foreground">
                  ESC to close
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
