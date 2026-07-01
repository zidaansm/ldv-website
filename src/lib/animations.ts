import type { Variants, Transition } from "framer-motion";

// ============================================
// FRAMER MOTION VARIANTS
// ============================================

/** Fade in from below with slight upward movement */
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.19, 1, 0.22, 1],
    },
  },
};

/** Fade in from above */
export const fadeInDown: Variants = {
  hidden: {
    opacity: 0,
    y: -30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.19, 1, 0.22, 1],
    },
  },
};

/** Fade in from the left */
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.19, 1, 0.22, 1],
    },
  },
};

/** Fade in from the right */
export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.19, 1, 0.22, 1],
    },
  },
};

/** Scale up from slightly smaller */
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

/** Simple fade */
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

// ============================================
// STAGGER CONTAINERS
// ============================================

/** Container that staggers its children */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/** Container with faster stagger */
export const staggerContainerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

/** Container with slower stagger */
export const staggerContainerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

// ============================================
// TRANSITION PRESETS
// ============================================

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.6,
  ease: [0.19, 1, 0.22, 1],
};

export const bounceTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 17,
};

// ============================================
// SCROLL ANIMATION DEFAULTS
// ============================================

export const scrollViewportConfig = {
  once: true,
  margin: "-100px" as const,
  amount: 0.2 as const,
};

// ============================================
// HOVER / TAP PRESETS
// ============================================

/** Neo-brutalist hover: lift up and expand shadow */
export const neoHover = {
  scale: 1.02,
  x: -4,
  y: -4,
  transition: { duration: 0.2, ease: [0.19, 1, 0.22, 1] },
};

/** Neo-brutalist tap: press down and remove shadow */
export const neoTap = {
  scale: 0.98,
  x: 4,
  y: 4,
  transition: { duration: 0.1 },
};

/** Subtle hover lift */
export const hoverLift = {
  y: -4,
  transition: { duration: 0.2, ease: "easeOut" as const },
};

/** Subtle image scale hover */
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.5, ease: "easeOut" as const },
};

/** Magnetic-style hover (for buttons) */
export const magneticHover = {
  scale: 1.05,
  transition: { type: "spring" as const, stiffness: 400, damping: 17 },
};
