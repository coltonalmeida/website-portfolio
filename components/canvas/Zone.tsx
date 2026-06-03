import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { MathUtils } from "three";
import type { Group } from "three";
import type { SectionId, ZoneConfig } from "@/types";
import { usePortfolio } from "@/lib/store";
import UnionStation from "./UnionStation";
import Construction from "./Construction";
import BillboardModel from "./BillboardModel";
import WaterfrontDock from "./WaterfrontDock";

/**
 * One clickable Toronto landmark. The outer group is fixed at the zone's world
 * position and owns the pointer events; an inner group animates a hover/active
 * lift + scale (mutated in `useFrame`, never via React props). Clicking sets
 * the active section; the camera fly-to reacts in `CameraRig`.
 *
 * Landmarks: Experience = Union Station + train · Projects = construction site ·
 * Skills = the "TORONTO" billboard · Contact = ferry dock.
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
    const targetY = lifted && !config.noLift ? 0.25 : 0;
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
        <Landmark id={config.id} glow={glow} />
      </group>
    </group>
  );
}

function Landmark({ id, glow }: { id: SectionId; glow: number }) {
  switch (id) {
    case "experience":
      return <UnionStation glow={glow} />;
    case "projects":
      return <Construction glow={glow} />;
    case "skills":
      return <BillboardModel glow={glow} />;
    case "contact":
      return <WaterfrontDock glow={glow} />;
  }
}
