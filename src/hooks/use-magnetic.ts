"use client";

import { useRef, useCallback, type MouseEvent } from "react";

interface UseMagneticOptions {
  strength?: number;
}

/**
 * Custom hook that creates a magnetic effect on an element.
 * The element follows the cursor when hovered.
 */
export function useMagnetic(options: UseMagneticOptions = {}) {
  const { strength = 0.3 } = options;
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const element = ref.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    },
    [strength]
  );

  const handleMouseLeave = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    element.style.transform = "translate(0px, 0px)";
    element.style.transition = "transform 0.4s cubic-bezier(0.19, 1, 0.22, 1)";

    setTimeout(() => {
      if (element) {
        element.style.transition = "";
      }
    }, 400);
  }, []);

  return {
    ref,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}
