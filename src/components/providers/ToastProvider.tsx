"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
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
