import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createTickerTexture } from "@/lib/tickerTexture";

/**
 * The Skills landmark: a glowing **LED ticker band** wrapped around the CN
 * Tower shaft whose skill words scroll horizontally (like the real tower's
 * light band / a stock ticker). Decorative — the accessible Skills content
 * still lives in the DOM overlay. `glow` (hover/active) brightens it.
 *
 * Rendered at the tower's position by the Skills `Zone`.
 */
const MARQUEE =
  "TYPESCRIPT • REACT • THREE.JS / R3F • NEXT.JS • NODE • TAILWIND • WEBGL • UI & MOTION";

export default function SkillsTicker({ glow = 0 }: { glow?: number }) {
  const [texture] = useState(() => createTickerTexture(MARQUEE));
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((_, delta) => {
    const m = matRef.current;
    if (!m) return;
    if (m.emissiveMap) m.emissiveMap.offset.x -= delta * 0.05;
    m.emissiveIntensity = 1.5 + glow * 1.5;
  });

  // The shaft radius at the band height (~y=5); band sits just proud of it.
  const bandY = 5;
  return (
    <group position={[0, bandY, 0]}>
      {/* Dark frame rings above/below the band */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.66, 0.05, 8, 24]} />
        <meshStandardMaterial color="#15181f" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.66, 0.05, 8, 24]} />
        <meshStandardMaterial color="#15181f" flatShading roughness={1} />
      </mesh>

      {/* Scrolling LED band */}
      <mesh>
        <cylinderGeometry args={[0.64, 0.64, 0.9, 32, 1, true]} />
        <meshStandardMaterial
          ref={matRef}
          map={texture}
          emissive="#ffffff"
          emissiveMap={texture}
          emissiveIntensity={1.5}
          color="#1a1206"
          side={THREE.DoubleSide}
          roughness={0.6}
        />
      </mesh>

      {/* Warm spill so the band lights the shaft around it */}
      <pointLight intensity={2 + glow * 4} distance={6} color="#ffb454" />
    </group>
  );
}
