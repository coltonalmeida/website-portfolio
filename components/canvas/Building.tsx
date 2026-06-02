import { useEffect, useMemo } from "react";
import { createWindowTexture } from "@/lib/windowTexture";

/**
 * One low-poly tower: a flat-shaded dark concrete box whose sides carry a
 * procedural "lit windows" emissive map, capped by a dark roof slab (which
 * hides the window grid on top) and an optional rooftop prop (water tower or
 * antenna). Window density/lit-ratio derive from the footprint + a seed so
 * every building reads a little differently.
 */
export interface BuildingProps {
  position: [number, number, number];
  /** Footprint width (x), height (y), depth (z). */
  size: [number, number, number];
  seed: number;
  /** Body tint — defaults to cool concrete. */
  color?: string;
  litChance?: number;
  rooftop?: "water-tower" | "antenna" | "none";
}

export default function Building({
  position,
  size,
  seed,
  color = "#0e1422",
  litChance = 0.6,
  rooftop = "none",
}: BuildingProps) {
  const [w, h, d] = size;

  // Window grid sized so cells stay roughly square on the widest face.
  const cols = Math.max(2, Math.round(w * 2.2));
  const rows = Math.max(3, Math.round(h * 1.7));

  const windows = useMemo(
    () => createWindowTexture({ cols, rows, seed, litChance }),
    [cols, rows, seed, litChance],
  );
  useEffect(() => () => windows.dispose(), [windows]);

  return (
    <group position={position}>
      {/* Tower body — windows glow from the emissive map. */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={color}
          emissive="#ffffff"
          emissiveMap={windows}
          emissiveIntensity={1.5}
          roughness={0.85}
          metalness={0.1}
          flatShading
        />
      </mesh>

      {/* Roof slab caps the top and hides the window grid up there. */}
      <mesh position={[0, h + 0.05, 0]} castShadow>
        <boxGeometry args={[w * 1.04, 0.16, d * 1.04]} />
        <meshStandardMaterial color="#0a0e18" flatShading roughness={1} />
      </mesh>

      {rooftop === "water-tower" && (
        <group position={[w * 0.18, h + 0.1, d * 0.1]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.5, 8]} />
            <meshStandardMaterial color="#3a2c22" flatShading roughness={1} />
          </mesh>
          <mesh position={[0, 0.88, 0]} castShadow>
            <coneGeometry args={[0.26, 0.3, 8]} />
            <meshStandardMaterial color="#2a201a" flatShading roughness={1} />
          </mesh>
          {/* legs */}
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.32, 0.36, 0.32]} />
            <meshStandardMaterial color="#241b15" flatShading />
          </mesh>
        </group>
      )}

      {rooftop === "antenna" && (
        <group position={[0, h + 0.1, 0]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.05, 1.4, 6]} />
            <meshStandardMaterial color="#3b4252" flatShading />
          </mesh>
          {/* aviation light */}
          <mesh position={[0, 1.42, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial
              color="#ff3b3b"
              emissive="#ff2222"
              emissiveIntensity={2.5}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
