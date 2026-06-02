import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { MathUtils } from "three";
import type { Group } from "three";
import type { SectionId, ZoneConfig } from "@/types";
import { usePortfolio } from "@/lib/store";

/**
 * One clickable landmark. The outer group is fixed at the zone's world
 * position and owns the pointer events; an inner group animates a hover/active
 * lift + scale (mutated in `useFrame`, never via React props, so re-renders
 * don't fight the animation). Clicking sets the active section in the store;
 * the camera fly-to reacts to that in Step 4.
 */
export default function Zone({ config }: { config: ZoneConfig }) {
  const innerRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  const activeSection = usePortfolio((s) => s.activeSection);
  const setActiveSection = usePortfolio((s) => s.setActiveSection);
  const setHoveredSection = usePortfolio((s) => s.setHoveredSection);

  const isActive = activeSection === config.id;
  const lifted = hovered || isActive;

  useFrame((_, delta) => {
    const g = innerRef.current;
    if (!g) return;
    const targetY = lifted ? 0.35 : 0;
    const targetScale = lifted ? 1.08 : 1;
    g.position.y = MathUtils.damp(g.position.y, targetY, 9, delta);
    const s = MathUtils.damp(g.scale.x, targetScale, 9, delta);
    g.scale.setScalar(s);
  });

  // Pointer cursor while hovering a landmark.
  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  const glow = lifted ? 0.7 : 0;

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

/** Dispatches to the right low-poly prop cluster for a section. */
function Landmark({ id, accent, glow }: LandmarkProps) {
  switch (id) {
    case "skills":
      return <SkillsLandmark accent={accent} glow={glow} />;
    case "projects":
      return <ProjectsLandmark accent={accent} glow={glow} />;
    case "experience":
      return <ExperienceLandmark accent={accent} glow={glow} />;
    case "contact":
      return <ContactLandmark accent={accent} glow={glow} />;
  }
}

type ClusterProps = { accent: string; glow: number };

/** Skills — a workbench with a glowing tool block. */
function SkillsLandmark({ accent, glow }: ClusterProps) {
  return (
    <group>
      {/* Tabletop */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.16, 1]} />
        <meshStandardMaterial color="#8a5a2b" flatShading roughness={1} />
      </mesh>
      {/* Legs */}
      {(
        [
          [0.72, 0.36, 0.4],
          [-0.72, 0.36, 0.4],
          [0.72, 0.36, -0.4],
          [-0.72, 0.36, -0.4],
        ] as [number, number, number][]
      ).map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.13, 0.72, 0.13]} />
          <meshStandardMaterial color="#6f4622" flatShading roughness={1} />
        </mesh>
      ))}
      {/* Glowing tool block (signature accent) */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.42, 0.42, 0.42]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={glow}
          flatShading
          roughness={0.7}
        />
      </mesh>
      {/* A small drill / mallet beside it */}
      <mesh position={[0.55, 0.92, 0.1]} rotation={[0, 0, Math.PI / 2.4]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.5, 8]} />
        <meshStandardMaterial color="#9aa0a6" flatShading roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Projects — a little cluster of buildings, one a glowing "monitor". */
function ProjectsLandmark({ accent, glow }: ClusterProps) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.4, 0.8]} />
        <meshStandardMaterial color="#cfd8e3" flatShading roughness={1} />
      </mesh>
      <mesh position={[0.85, 0.5, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 1.0, 0.6]} />
        <meshStandardMaterial color="#b8c4d2" flatShading roughness={1} />
      </mesh>
      <mesh position={[-0.8, 0.45, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.9, 0.7]} />
        <meshStandardMaterial color="#c4cdda" flatShading roughness={1} />
      </mesh>
      {/* Glowing screen face on the tallest building */}
      <mesh position={[0, 0.95, 0.42]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.06]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={glow}
          flatShading
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

/** Experience — stacked platforms (a journey) topped with a glowing flag. */
function ExperienceLandmark({ accent, glow }: ClusterProps) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.3, 1.5]} />
        <meshStandardMaterial color="#9aa0a6" flatShading roughness={1} />
      </mesh>
      <mesh position={[0.15, 0.45, 0.15]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.3, 1.05]} />
        <meshStandardMaterial color="#aab0b6" flatShading roughness={1} />
      </mesh>
      <mesh position={[0.3, 0.75, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.3, 0.6]} />
        <meshStandardMaterial color="#babfc4" flatShading roughness={1} />
      </mesh>
      {/* Flag pole + glowing flag */}
      <mesh position={[0.3, 1.25, 0.3]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
        <meshStandardMaterial color="#5b4636" flatShading roughness={1} />
      </mesh>
      <mesh position={[0.52, 1.45, 0.3]} castShadow>
        <boxGeometry args={[0.4, 0.28, 0.04]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={glow}
          flatShading
          roughness={0.7}
        />
      </mesh>
    </group>
  );
}

/** Contact — a lighthouse with a glowing lantern room. */
function ContactLandmark({ accent, glow }: ClusterProps) {
  return (
    <group>
      {/* Rock base */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.9, 0.4, 10]} />
        <meshStandardMaterial color="#7d7066" flatShading roughness={1} />
      </mesh>
      {/* Tower */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.6, 1.8, 12]} />
        <meshStandardMaterial color="#f2f2ef" flatShading roughness={1} />
      </mesh>
      {/* Accent band */}
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.52, 0.56, 0.38, 12]} />
        <meshStandardMaterial color={accent} flatShading roughness={0.8} />
      </mesh>
      {/* Glowing lantern room */}
      <mesh position={[0, 2.25, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.45, 8]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={Math.max(glow, 0.25)}
          flatShading
          roughness={0.5}
        />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 2.65, 0]} castShadow>
        <coneGeometry args={[0.5, 0.5, 8]} />
        <meshStandardMaterial color="#44505a" flatShading roughness={1} />
      </mesh>
    </group>
  );
}
