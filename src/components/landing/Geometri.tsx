"use client";
import { Canvas } from "@react-three/fiber";
import { ParticleSystem, TechIcon } from "./ParticleSystem";
import { useState } from "react";
import { ScrollContent } from "./ScrollContent";

const DEFAULT_TECH_ICONS: TechIcon[] = [
  {
    name: "usdt",
    icon: "/icons/usdt-logo.svg",
  },
  {
    name: "usdt",
    icon: "/wsusdc.png",
  },
  {
    name: "uni",
    icon: "/icons/uni-logo.svg",
  },

  {
    name: "jupiter",
    icon: "/icons/jupiter-logo.svg",
  },
  {
    name: "usdc",
    icon: "/icons/usdc-logo.svg",
  },
];

export interface GeometriProps {
  particleCount?: number;
  sphereRadius?: number;
  rotationSpeed?: number;
  particleColor?: string;
  particleSize?: number;
  height?: string;
  showScrollIndicator?: boolean;
  techIcons?: TechIcon[];
  children?: React.ReactNode;
  title?: string;
}

export default function Geometri({
  particleCount = 14000,
  sphereRadius = 15,
  rotationSpeed = 0.05,
  particleColor = "#4a9eff",
  particleSize = 0.08,
  height = "200vh",
  techIcons = DEFAULT_TECH_ICONS,
  children,
}: GeometriProps) {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const fadeStart = 0.995;
  const clamped = Math.min(
    Math.max((scrollProgress - fadeStart) / (1 - fadeStart), 0),
    1
  );
  const canvasOpacity = 1 - clamped;
  const canvasPointerEvents = canvasOpacity > 0.05 ? "auto" : "none";

  return (
    <>
      {/* Fixed Canvas (hidden after hero scroll) */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100vh",
          zIndex: 1,
          transition: "opacity 0.35s ease, visibility 0.35s",
          opacity: canvasOpacity,
          pointerEvents: canvasPointerEvents,
          visibility: canvasOpacity > 0 ? "visible" : "hidden",
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 30], fov: 75 }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={["#000000"]} />
          <ambientLight intensity={0.5} />
          <ParticleSystem
            particleCount={particleCount}
            sphereRadius={sphereRadius}
            rotationSpeed={rotationSpeed}
            particleColor={particleColor}
            particleSize={particleSize}
            techIcons={techIcons}
            scrollProgress={scrollProgress}
          />
        </Canvas>
      </div>

      {/* Scroll Content */}
      <ScrollContent height={height} onScrollProgress={setScrollProgress}>
        {children}
      </ScrollContent>
    </>
  );
}
