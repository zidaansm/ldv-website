"use client";

import { useEffect, useRef } from "react";

export function useFocusTrap(isActive: boolean, onClose?: () => void) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const currentRef = ref.current;
    if (!currentRef) return;

    // Focusable elements selector
    const focusableElements = currentRef.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus the first element when the modal opens
    if (firstElement) {
      // Small timeout ensures it focuses after render
      setTimeout(() => firstElement.focus(), 50);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
        return;
      }

      if (e.key === "Tab") {
        if (e.shiftKey) {
          // If shift + tab and focus is on the first element, move to the last
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // If tab and focus is on the last element, move to the first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Revert focus when closing
    const previousActiveElement = document.activeElement as HTMLElement;

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousActiveElement) {
        setTimeout(() => previousActiveElement.focus(), 0);
      }
    };
  }, [isActive, onClose]);

  return ref;
}
