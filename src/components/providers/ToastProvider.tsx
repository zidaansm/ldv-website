"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <Toaster
      position={isMobile ? "top-center" : "bottom-right"}
      containerStyle={isMobile ? { top: 80 } : { bottom: 100 }}
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--foreground)",
          border: "2px solid var(--border)",
          boxShadow: "4px 4px 0px var(--border)",
          borderRadius: "0.75rem",
          fontWeight: "bold",
        },
        success: {
          iconTheme: {
            primary: "var(--success)",
            secondary: "var(--success-foreground)",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--danger)",
            secondary: "var(--danger-foreground)",
          },
        },
      }}
    />
  );
}
