"use client";

import { motion, useSpring, useTransform, useMotionValue, MotionValue } from "framer-motion";
import { useEffect } from "react";

type ShapeConfig = {
  type: "square" | "circle" | "pill" | "triangle" | "diamond";
  className: string;
  initialPos: any;
  animate: any;
  parallaxFactor: number;
  duration: number;
  delay?: number;
};

// SVG Triangle that mimics neo-border
const TriangleSVG = ({ className }: { className: string }) => (
  <svg viewBox="0 0 100 100" className={className} style={{ overflow: "visible", filter: "drop-shadow(4px 4px 0px var(--foreground))" }}>
    <polygon points="50,10 10,90 90,90" stroke="var(--foreground)" strokeWidth="6" strokeLinejoin="round" />
  </svg>
);

const shapes: ShapeConfig[] = [
    // 1. Primary Square (Left Top)
    {
      type: "square",
      className: "w-24 h-24 bg-primary neo-border rounded-xl",
      initialPos: { left: "5%", top: "15%" },
      animate: { y: [0, -20, 0], rotate: [0, 10, 0] },
      parallaxFactor: 30,
      duration: 5,
    },
    // 2. Secondary Circle (Right Top)
    {
      type: "circle",
      className: "w-16 h-16 bg-secondary neo-border rounded-full",
      initialPos: { right: "10%", top: "25%" },
      animate: { y: [0, 30, 0], x: [0, 15, 0] },
      parallaxFactor: -40,
      duration: 7,
      delay: 1,
    },
    // 3. Accent Triangle (Left Bottom)
    {
      type: "triangle",
      className: "w-20 h-20 fill-accent",
      initialPos: { left: "15%", bottom: "15%" },
      animate: { y: [0, -15, 0], rotate: [0, -15, 0] },
      parallaxFactor: 45,
      duration: 6,
      delay: 2,
    },
    // 4. Primary Circle (Right Bottom)
    {
      type: "circle",
      className: "w-14 h-14 bg-primary neo-border rounded-full",
      initialPos: { right: "18%", bottom: "20%" },
      animate: { rotate: [0, 90, 180, 270, 360], y: [0, 15, 0] },
      parallaxFactor: -25,
      duration: 10,
    },
    // 5. Secondary Diamond (Center Left Top)
    {
      type: "diamond",
      className: "w-12 h-12 bg-secondary neo-border rounded-lg",
      initialPos: { left: "30%", top: "8%" },
      animate: { rotate: [45, 90, 45], scale: [1, 1.1, 1] },
      parallaxFactor: 50,
      duration: 4,
      delay: 0.5,
    },
    // 6. Accent Pill (Center Right Top)
    {
      type: "pill",
      className: "w-16 h-8 bg-accent neo-border rounded-full",
      initialPos: { right: "35%", top: "12%" },
      animate: { rotate: [-10, 10, -10], x: [0, -15, 0] },
      parallaxFactor: -35,
      duration: 8,
      delay: 1.5,
    },
    // 7. Accent Diamond (Center Right Bottom)
    {
      type: "diamond",
      className: "w-20 h-20 bg-accent neo-border rounded-xl",
      initialPos: { right: "35%", bottom: "8%" },
      animate: { rotate: [15, 30, 15], y: [0, -15, 0] },
      parallaxFactor: 45,
      duration: 7,
      delay: 2.5,
    },
    // 8. Secondary Triangle (Center Left Bottom)
    {
      type: "triangle",
      className: "w-16 h-16 fill-secondary",
      initialPos: { left: "40%", bottom: "5%" },
      animate: { rotate: [-20, 0, -20], x: [0, 15, 0] },
      parallaxFactor: -50,
      duration: 9,
      delay: 0.2,
    }
];

function Shape({ config, mouseX, mouseY }: { config: ShapeConfig, mouseX: MotionValue<number>, mouseY: MotionValue<number> }) {
  const x = useTransform(mouseX, [-1, 1], [-config.parallaxFactor, config.parallaxFactor]);
  const y = useTransform(mouseY, [-1, 1], [-config.parallaxFactor, config.parallaxFactor]);

  return (
    <motion.div
      className="absolute"
      style={{
        ...config.initialPos,
        x,
        y,
        zIndex: 0,
      }}
    >
      <motion.div
        className={config.className}
        animate={config.animate}
        transition={{
          duration: config.duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: config.delay || 0,
        }}
        // Pre-rotate diamonds
        style={config.type === "diamond" ? { rotate: 45 } : {}}
      >
        {config.type === "triangle" && <TriangleSVG className="w-full h-full" />}
      </motion.div>
    </motion.div>
  );
}

export function GeoShapes() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 100, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates between -1 and 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {shapes.map((shape, i) => (
        <Shape key={i} config={shape} mouseX={smoothMouseX} mouseY={smoothMouseY} />
      ))}
    </div>
  );
}
