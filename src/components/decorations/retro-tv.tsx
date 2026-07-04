"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Outlines, Text } from "@react-three/drei";
import * as THREE from "three";
import { playPop } from "@/lib/sounds";

function TVModel() {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const [showText, setShowText] = useState(false);
  const targetRot = useRef({ x: 0, y: 0 });

  const colors = ["#8B5CF6", "#ef4444", "#3b82f6", "#10b981", "#f59e0b"]; // primary, danger, blue, green, yellow

  const lastMouse = useRef({ x: typeof window !== "undefined" ? window.innerWidth / 2 : 0, y: typeof window !== "undefined" ? window.innerHeight / 2 : 0 });

  useEffect(() => {
    const updateRotation = () => {
      const container = document.getElementById("retro-tv-container");
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const tvCenterX = rect.left + rect.width / 2;
      const tvCenterY = rect.top + rect.height / 2 - 20;

      const deltaX = lastMouse.current.x - tvCenterX;
      const deltaY = lastMouse.current.y - tvCenterY;

      const x = (deltaX / window.innerWidth) * 2.5;
      const y = -(deltaY / window.innerHeight) * 2.5;

      const clampedX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, x));
      const clampedY = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, y));

      targetRot.current = { x: clampedX, y: clampedY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastMouse.current = { x: e.clientX, y: e.clientY };
      updateRotation();
    };

    const handleScroll = () => {
      updateRotation();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial update
    updateRotation();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += (targetRot.current.x - groupRef.current.rotation.y) * 0.1;
      groupRef.current.rotation.x += (-targetRot.current.y - groupRef.current.rotation.x) * 0.1;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setColorIndex((prev) => (prev + 1) % colors.length);
    setShowText((prev) => !prev);
    playPop();
  };

  return (
    <group 
      ref={groupRef} 
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "default"; }}
      scale={hovered ? 1.05 : 1}
    >
      {/* TV Body (Main Box) */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.6, 1.2]} />
        <meshStandardMaterial color={colors[colorIndex]} />
        <Outlines thickness={0.06} color="black" />
      </mesh>

      {/* Screen Bezel (Thick Black Frame) */}
      <mesh position={[0, 0, 0.65]} castShadow>
        <boxGeometry args={[1.7, 1.3, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" />
        <Outlines thickness={0.04} color="black" />
      </mesh>

      {/* Screen Glass (Inset slightly or raised) */}
      <mesh position={[0, 0, 0.7]}>
        <boxGeometry args={[1.5, 1.1, 0.05]} />
        <meshBasicMaterial color="#FEF2E8" />
        <Outlines thickness={0.03} color="black" />
      </mesh>

      {/* Screen Content */}
      <group position={[0, -0.05, 0.73]}>
        {showText ? (
          <Text
            color="black"
            fontSize={0.65}
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            LDV
          </Text>
        ) : (
          <Text
            color="black"
            fontSize={0.75}
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
            rotation={[0, 0, -Math.PI / 2]}
          >
            {":-)"}
          </Text>
        )}
      </group>

      {/* Antenna base */}
      <mesh position={[0.5, 0.85, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.1, 8]} />
        <meshStandardMaterial color="#333" />
        <Outlines thickness={0.05} color="black" />
      </mesh>
      
      {/* Antenna pole 1 */}
      <mesh position={[0.6, 1.2, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8]} />
        <meshStandardMaterial color="#555" />
        <Outlines thickness={0.1} color="black" />
      </mesh>
      
      {/* Antenna pole 2 */}
      <mesh position={[-0.2, 1.2, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8]} />
        <meshStandardMaterial color="#555" />
        <Outlines thickness={0.1} color="black" />
      </mesh>

      {/* TV Stand Base */}
      <mesh position={[0, -0.9, 0]}>
        <boxGeometry args={[1, 0.2, 0.8]} />
        <meshStandardMaterial color="#333" />
        <Outlines thickness={0.06} color="black" />
      </mesh>
      
      {/* TV Stand Neck */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.2, 8]} />
        <meshStandardMaterial color="#333" />
        <Outlines thickness={0.1} color="black" />
      </mesh>
    </group>
  );
}

export function RetroTV() {
  return (
    <div id="retro-tv-container" className="w-full h-full relative" style={{ minHeight: "400px" }}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <TVModel />
      </Canvas>
    </div>
  );
}
