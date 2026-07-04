"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Outlines } from "@react-three/drei";
import * as THREE from "three";
import { playPop } from "@/lib/sounds";

function RobotModel() {
  const headRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);
  const targetRot = useRef({ x: 0, y: 0 });

  const colors = ["#f59e0b", "#3b82f6", "#ef4444", "#10b981", "#8B5CF6"]; // yellow, blue, red, green, purple

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById("retro-robot-container");
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2 - 20;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      const x = (deltaX / window.innerWidth) * 2.5;
      const y = -(deltaY / window.innerHeight) * 2.5;

      const clampedX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, x));
      const clampedY = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, y));

      targetRot.current = { x: clampedX, y: clampedY };
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state) => {
    if (headRef.current) {
      headRef.current.rotation.y += (targetRot.current.x - headRef.current.rotation.y) * 0.1;
      headRef.current.rotation.x += (-targetRot.current.y - headRef.current.rotation.x) * 0.1;
    }
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    setColorIndex((prev) => (prev + 1) % colors.length);
    playPop();
  };

  return (
    <group 
      ref={bodyRef} 
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "default"; }}
      scale={hovered ? 1.05 : 1}
    >
      {/* Robot Body */}
      <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.4, 0.8]} />
        <meshStandardMaterial color={colors[colorIndex]} />
        <Outlines thickness={0.06} color="black" />
      </mesh>

      {/* Screen/Dial on Body */}
      <mesh position={[0, -0.4, 0.41]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" />
        <Outlines thickness={0.04} color="black" />
      </mesh>
      
      {/* Glowing gauge line */}
      <mesh position={[-0.2, -0.4, 0.47]}>
        <planeGeometry args={[0.2, 0.1]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      <mesh position={[0.1, -0.4, 0.47]}>
        <planeGeometry args={[0.1, 0.1]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Left Arm */}
      <group position={[-0.8, -0.3, 0]} rotation={[0, 0, -0.2]}>
        <mesh>
          <boxGeometry args={[0.4, 1, 0.4]} />
          <meshStandardMaterial color={colors[colorIndex]} />
          <Outlines thickness={0.06} color="black" />
        </mesh>
        {/* Claw */}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 8]} />
          <meshStandardMaterial color="#333" />
          <Outlines thickness={0.04} color="black" />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[0.8, -0.3, 0]} rotation={[0, 0, 0.2]}>
        <mesh>
          <boxGeometry args={[0.4, 1, 0.4]} />
          <meshStandardMaterial color={colors[colorIndex]} />
          <Outlines thickness={0.06} color="black" />
        </mesh>
        {/* Claw */}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.3, 8]} />
          <meshStandardMaterial color="#333" />
          <Outlines thickness={0.04} color="black" />
        </mesh>
      </group>

      {/* Base/Wheels */}
      <mesh position={[0, -1.4, 0]}>
        <boxGeometry args={[1, 0.3, 0.9]} />
        <meshStandardMaterial color="#333" />
        <Outlines thickness={0.06} color="black" />
      </mesh>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.2, 8]} />
        <meshStandardMaterial color="#333" />
        <Outlines thickness={0.1} color="black" />
      </mesh>

      {/* Robot Head (tracks mouse) */}
      <group ref={headRef} position={[0, 0.4, 0]}>
        {/* Neck */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.3, 8]} />
          <meshStandardMaterial color="#333" />
          <Outlines thickness={0.05} color="black" />
        </mesh>

        {/* Head Box */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[1.4, 1.2, 1.2]} />
          <meshStandardMaterial color={colors[colorIndex]} />
          <Outlines thickness={0.06} color="black" />
        </mesh>

        {/* Big Eye (Visor) Bezel */}
        <mesh position={[0, 0.5, 0.61]} castShadow>
          <boxGeometry args={[1.1, 0.5, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" />
          <Outlines thickness={0.04} color="black" />
        </mesh>

        {/* Glowing Eye Center */}
        <mesh position={[0, 0.5, 0.67]}>
          <boxGeometry args={[0.5, 0.2, 0.05]} />
          <meshBasicMaterial color="#FEF2E8" />
          <Outlines thickness={0.03} color="black" />
        </mesh>

        {/* Antenna */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.6]} />
          <meshStandardMaterial color="#555" />
          <Outlines thickness={0.08} color="black" />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color="#ef4444" />
          <Outlines thickness={0.04} color="black" />
        </mesh>
      </group>
    </group>
  );
}

export function RetroRobot() {
  return (
    <div id="retro-robot-container" className="w-full h-full relative" style={{ minHeight: "450px" }}>
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <RobotModel />
      </Canvas>
    </div>
  );
}
