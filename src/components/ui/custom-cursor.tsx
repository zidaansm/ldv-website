"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

type Particle = {
  id: number;
  x: number;
  y: number;
  char: string;
};

export function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  const springConfig = { damping: 50, stiffness: 1000, mass: 0.1 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  
  const [isHovering, setIsHovering] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdCounter = useRef(0);
  
  // Disable on touch devices and reduced motion
  const [isDesktop, setIsDesktop] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // Check if device has a fine pointer (mouse)
    const mediaQuery = window.matchMedia("(pointer: fine)");
    setIsDesktop(mediaQuery.matches);
    
    const updateMedia = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener("change", updateMedia);

    // Check reduced motion
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(motionQuery.matches);

    const updateMotionMedia = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    motionQuery.addEventListener("change", updateMotionMedia);

    return () => {
      mediaQuery.removeEventListener("change", updateMedia);
      motionQuery.removeEventListener("change", updateMotionMedia);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    let lastSpawnTime = 0;
    const chars = ["L", "D", "V", "❤️", "✨"];

    const updateMousePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX - 4); // Offset slightly to put the tip exactly at the mouse pointer
      cursorY.set(e.clientY - 4);

      // Spawn particles when moving
      const now = Date.now();
      if (now - lastSpawnTime > 150) { // spawn every 150ms to reduce re-renders
        const char = chars[Math.floor(Math.random() * chars.length)];
        const newParticle: Particle = {
          id: particleIdCounter.current++,
          x: e.clientX,
          y: e.clientY,
          char,
        };
        
        setParticles(prev => [...prev.slice(-15), newParticle]); // keep max 15
        lastSpawnTime = now;
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'a' || 
          target.tagName.toLowerCase() === 'button' ||
          target.closest('a') || 
          target.closest('button')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", updateMousePosition);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [isDesktop]);

  // Clean up particles
  useEffect(() => {
    if (particles.length > 0) {
      const timer = setTimeout(() => {
        setParticles((prev) => prev.filter(p => p.id !== particles[0].id));
      }, 800); // particle lives for 800ms
      return () => clearTimeout(timer);
    }
  }, [particles]);

  if (!isDesktop || isReducedMotion) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * { cursor: none !important; }
      `}} />
      
      {/* Main Cursor (Rocket) */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[10000]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
        }}
        animate={{
          scale: isHovering ? 1.2 : 1,
          rotate: isHovering ? -10 : 0,
        }}
      >
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(2px 2px 0px rgba(0,0,0,1))" }}>
          <g>
            {/* White outline / Sticker base */}
            <path d="M 3 3 L 37 15 L 29 23 L 34 28 C 37 31 38 38 41 41 C 38 38 31 37 28 34 L 23 29 L 15 37 Z" fill="white" stroke="white" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round"/>
            
            {/* Pink Flame */}
            <path d="M 23 23 L 34 28 C 38 30 42 38 43 43 C 38 42 30 38 28 34 L 23 23 Z" fill="#ff4dd2" stroke="#171738" strokeWidth="2.5" strokeLinejoin="round"/>
            
            {/* Blue Thruster */}
            <path d="M 21 21 L 28 28 L 24 32 L 17 25 Z" fill="#00a8ff" stroke="#171738" strokeWidth="2.5" strokeLinejoin="round"/>
            
            {/* Purple Rocket Body */}
            <path d="M 4 4 L 36 14 C 38 14.5 38 17 36 17.5 L 23 23 L 17.5 36 C 17 38 14.5 38 14 36 Z" fill="#a55eea" stroke="#171738" strokeWidth="2.5" strokeLinejoin="round"/>
            
            {/* Window */}
            <circle cx="15" cy="15" r="4.5" fill="#171738"/>
            <circle cx="15" cy="15" r="3" fill="#00a8ff"/>
            <circle cx="14" cy="14" r="1" fill="white"/>
          </g>
        </svg>
      </motion.div>

      {/* Particles */}
      <div className="fixed top-0 left-0 pointer-events-none z-[9998]">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute text-brand-purple font-black text-2xl drop-shadow-md"
              style={{ fontFamily: "var(--font-space-grotesk)", textShadow: "2px 2px 0px #000" }}
              initial={{ 
                opacity: 1, 
                x: p.x - 10 + (Math.random() * 20 - 10), 
                y: p.y - 10 + (Math.random() * 20 - 10),
                scale: 0.5,
                rotate: Math.random() * 60 - 30
              }}
              animate={{ 
                opacity: 0,
                y: p.y - 60 - Math.random() * 40,
                x: p.x + (Math.random() * 60 - 30),
                scale: 1.5,
                rotate: Math.random() * 180 - 90
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {p.char}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
