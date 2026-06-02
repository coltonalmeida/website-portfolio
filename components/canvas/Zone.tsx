import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { MathUtils } from "three";
import type { Group } from "three";
import type { SectionId, ZoneConfig } from "@/types";
import { usePortfolio } from "@/lib/store";
import { LAKE_Y } from "./Island";
import Building from "./Building";
import CNTower from "./CNTower";

/**
 * One clickable Toronto landmark. The outer group is fixed at the zone's world
 * position and owns the pointer events; an inner group animates a hover/active
 * lift + scale (mutated in `useFrame`, never via React props). Clicking sets
 * the active section; the camera fly-to reacts to that in `CameraRig`.
 */
export default function Zone({ config }: { config: ZoneConfig }) {
  const innerRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  const activeSection = usePortfolio((s) => s.activeSection);
  const hoveredSection = usePortfolio((s) => s.hoveredSection);
  const setActiveSection = usePortfolio((s) => s.setActiveSection);
  const setHoveredSection = usePortfolio((s) => s.setHoveredSection);

  const isActive = activeSection === config.id;
  const lifted = hovered || hoveredSection === config.id || isActive;

  useFrame((_, delta) => {
    const g = innerRef.current;
    if (!g) return;
    const targetY = lifted ? 0.22 : 0;
    const targetScale = lifted ? 1.05 : 1;
    g.position.y = MathUtils.damp(g.position.y, targetY, 9, delta);
    const s = MathUtils.damp(g.scale.x, targetScale, 9, delta);
    g.scale.setScalar(s);
  });

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  const glow = lifted ? 1 : 0;

  return (
    <group
      position={config.position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setHoveredSection(config.id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        setHoveredSection(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setActiveSection(config.id);
      }}
    >
      <group ref={innerRef}>
        <Landmark id={config.id} accent={config.color} glow={glow} />
      </group>
    </group>
  );
}

type LandmarkProps = { id: SectionId; accent: string; glow: number };

function Landmark({ id, accent, glow }: LandmarkProps) {
  switch (id) {
    case "experience":
      return <CNTower glow={glow} />;
    case "projects":
      return <FinancialDistrict accent={accent} glow={glow} />;
    case "skills":
      return <StreetcarBlock accent={accent} glow={glow} />;
    case "contact":
      return <WaterfrontDock accent={accent} glow={glow} />;
  }
}

type ClusterProps = { accent: string; glow: number };

/** Projects — a cluster of Financial District glass towers. */
function FinancialDistrict({ accent, glow }: ClusterProps) {
  return (
    <group>
      <Building position={[0, 0, 0]} size={[1.6, 6.6, 1.6]} seed={11} color="#0e1b30" litChance={0.72} rooftop="antenna" />
      <Building position={[1.9, 0, 0.3]} size={[1.3, 5.0, 1.3]} seed={12} color="#101f36" litChance={0.66} rooftop="water-tower" />
      <Building position={[-1.7, 0, 0.5]} size={[1.2, 4.4, 1.2]} seed={13} color="#0d1a2e" litChance={0.62} />
      <Building position={[0.5, 0, 1.9]} size={[1.5, 7.4, 1.5]} seed={14} color="#0e1d33" litChance={0.74} rooftop="antenna" />
      <Building position={[-0.7, 0, -1.6]} size={[1.1, 3.8, 1.1]} seed={15} color="#0d1828" litChance={0.6} rooftop="water-tower" />
      <pointLight position={[0, 5.5, 1]} intensity={2 + glow * 12} distance={14} color={accent} />
    </group>
  );
}

/** Skills — a red TTC streetcar in front of a brick workshop block. */
function StreetcarBlock({ accent, glow }: ClusterProps) {
  return (
    <group>
      {/* Workshop building (Distillery District brick vibe) */}
      <Building position={[0, 0, -1.9]} size={[3.2, 3.0, 2.2]} seed={21} color="#2a1414" litChance={0.5} />
      {/* Chimney */}
      <mesh position={[1.1, 3.4, -2.2]} castShadow>
        <boxGeometry args={[0.4, 1.4, 0.4]} />
        <meshStandardMaterial color="#1c1010" flatShading roughness={1} />
      </mesh>

      {/* Rails */}
      <mesh position={[0, 0.02, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 1.2]} />
        <meshStandardMaterial color="#0a0d14" roughness={1} />
      </mesh>

      {/* Streetcar */}
      <group position={[0, 0, 0.9]}>
        <mesh position={[0, 0.78, 0]} castShadow>
          <boxGeometry args={[3.2, 0.9, 1.05]} />
          <meshStandardMaterial color="#c0392b" flatShading roughness={0.7} />
        </mesh>
        {/* Window band */}
        <mesh position={[0, 0.98, 0]}>
          <boxGeometry args={[2.8, 0.34, 1.08]} />
          <meshStandardMaterial color="#1a1407" emissive="#ffcf7a" emissiveIntensity={1.3 + glow} flatShading />
        </mesh>
        {/* Roof */}
        <mesh position={[0, 1.3, 0]} castShadow>
          <boxGeometry args={[3.0, 0.16, 0.95]} />
          <meshStandardMaterial color="#8f291f" flatShading roughness={0.8} />
        </mesh>
        {/* Pantograph */}
        <mesh position={[0.2, 1.5, 0]}>
          <boxGeometry args={[0.05, 0.3, 0.5]} />
          <meshStandardMaterial color="#2b2f38" flatShading />
        </mesh>
        {/* Headlights */}
        {[0.4, -0.4].map((z) => (
          <mesh key={z} position={[1.62, 0.7, z]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#fff6d8" emissive="#fff0c0" emissiveIntensity={2.5 + glow * 2} />
          </mesh>
        ))}
        {/* Route sign */}
        <mesh position={[1.61, 1.1, 0]}>
          <boxGeometry args={[0.04, 0.22, 0.5]} />
          <meshStandardMaterial color="#0c0c0c" emissive={accent} emissiveIntensity={1.6} />
        </mesh>
        {/* Wheels */}
        {[1.1, -1.1].map((x) => (
          <mesh key={x} position={[x, 0.28, 0]}>
            <boxGeometry args={[0.5, 0.3, 1.0]} />
            <meshStandardMaterial color="#15171d" flatShading />
          </mesh>
        ))}
      </group>

      <pointLight position={[1.8, 1.0, 0.9]} intensity={2 + glow * 6} distance={7} color="#ffd28a" />
    </group>
  );
}

/** Contact — a waterfront ferry dock reaching over Lake Ontario. */
function WaterfrontDock({ accent, glow }: ClusterProps) {
  const pilingY = (LAKE_Y - 0.6) / 2; // centre of a piling from deck to below water
  const pilingH = Math.abs(LAKE_Y - 0.6) + 0.6;
  return (
    <group>
      {/* Deck */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 0.16, 4.2]} />
        <meshStandardMaterial color="#5b3a22" flatShading roughness={1} />
      </mesh>
      {/* Plank lines */}
      {[-1.4, -0.7, 0, 0.7, 1.4].map((z) => (
        <mesh key={z} position={[0, 0.14, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.0, 0.05]} />
          <meshStandardMaterial color="#3f2817" />
        </mesh>
      ))}
      {/* Pilings */}
      {[
        [-1.3, -1.9],
        [1.3, -1.9],
        [-1.3, 1.9],
        [1.3, 1.9],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, pilingY, z]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, pilingH, 6]} />
          <meshStandardMaterial color="#3a2616" flatShading roughness={1} />
        </mesh>
      ))}

      {/* Dock lamp post + glowing lamp */}
      <group position={[1.2, 0, -1.8]}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 1.6, 6]} />
          <meshStandardMaterial color="#23303a" flatShading />
        </mesh>
        <mesh position={[0, 1.75, 0]}>
          <sphereGeometry args={[0.16, 10, 10]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2 + glow * 2} />
        </mesh>
        <pointLight position={[0, 1.75, 0]} intensity={3 + glow * 5} distance={8} color={accent} />
      </group>

      {/* Mailbox by the lake (Canada Post red) */}
      <group position={[-1.1, 0, -1.7]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.4, 0.6, 0.3]} />
          <meshStandardMaterial color="#b8242b" flatShading roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.4, 8, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#9c1f25" flatShading />
        </mesh>
      </group>

      {/* Little boat moored alongside */}
      <group position={[-2.1, LAKE_Y + 0.18, 0.4]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.9, 0.32, 1.9]} />
          <meshStandardMaterial color="#d7e1ea" flatShading roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.42, -0.2]}>
          <boxGeometry args={[0.6, 0.32, 0.7]} />
          <meshStandardMaterial color="#23507a" flatShading />
        </mesh>
        <mesh position={[0, 0.95, 0.3]}>
          <cylinderGeometry args={[0.03, 0.03, 1.0, 6]} />
          <meshStandardMaterial color="#2b2f38" />
        </mesh>
        <mesh position={[0, 1.2, 0.3]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#7CFC00" emissive="#7CFC00" emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  );
}
