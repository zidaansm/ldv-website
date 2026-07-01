"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide the splash screen after 2.5 seconds
    const timer = setTimeout(() => setIsVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[9999] bg-primary flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Decorative shapes in background */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.7, type: "spring", bounce: 0.5 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <img 
              src="/logo-ldv.png" 
              alt="LDV Logo" 
              className="w-48 md:w-64 h-auto object-contain drop-shadow-2xl"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 1, ease: "easeInOut" }}
              className="h-1 bg-accent rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
