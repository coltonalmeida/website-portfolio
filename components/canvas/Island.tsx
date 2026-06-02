import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import type { Group } from "three";

/**
 * The low-poly island base: water, a sandy shoreline, a grassy plateau, a
 * rocky underwater taper, and a few decorative pines. Everything is built
 * from cheap primitives with `flatShading` for the faceted low-poly look.
 *
 * GLB seam: pass `modelUrl` (after dropping a `.glb` into `public/models/`)
 * to swap the whole primitive base for a loaded model — zones and camera
 * wiring stay untouched. Until then the primitive path renders.
 */

// Vertical reference points (world Y) so props sit on the right surface.
const SAND_TOP = 0.8;
const GRASS_TOP = 1.6;

type IslandProps = ThreeElements["group"] & {
  /** Optional `.glb` URL; when set, replaces the primitive base. */
  modelUrl?: string;
};

export default function Island({ modelUrl, ...groupProps }: IslandProps) {
  return (
    <group {...groupProps}>
      {modelUrl ? <IslandModel url={modelUrl} /> : <PrimitiveIsland />}
    </group>
  );
}

function PrimitiveIsland() {
  return (
    <group>
      {/* Water — large flat plane the island sits in. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#2f6f9f" roughness={0.85} metalness={0} />
      </mesh>

      {/* Rocky base tapering down beneath the water. */}
      <mesh position={[0, -1.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[6, 3, 3.2, 12, 1]} />
        <meshStandardMaterial color="#5d5043" flatShading roughness={1} />
      </mesh>

      {/* Sandy shoreline ring (pokes above the water line). */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[7.2, 6, 1.6, 18, 1]} />
        <meshStandardMaterial color="#e6cf9c" flatShading roughness={1} />
      </mesh>

      {/* Grassy plateau the zones live on. */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[6.3, 6.9, 0.8, 18, 1]} />
        <meshStandardMaterial color="#6fae4f" flatShading roughness={1} />
      </mesh>

      {/* A gentle hill for elevation interest. */}
      <mesh position={[-3, GRASS_TOP, -2.4]} castShadow receiveShadow>
        <coneGeometry args={[2.4, 1.8, 8, 1]} />
        <meshStandardMaterial color="#5e9b41" flatShading roughness={1} />
      </mesh>

      {/* Decorative pines scattered on the plateau (deterministic). */}
      {TREES.map((t, i) => (
        <Tree key={i} position={[t.x, GRASS_TOP, t.z]} scale={t.s} />
      ))}
    </group>
  );
}

// Fixed tree positions, tucked toward the interior so they don't collide
// with the four zone landmarks placed near the cardinal edges.
const TREES: { x: number; z: number; s: number }[] = [
  { x: -2.2, z: 1.8, s: 1.0 },
  { x: -3.6, z: -0.2, s: 0.8 },
  { x: 1.6, z: 2.6, s: 0.9 },
  { x: 2.8, z: -1.4, s: 1.1 },
  { x: -1.2, z: -2.6, s: 0.85 },
  { x: 0.4, z: 0.6, s: 0.7 },
];

function Tree({
  position,
  scale = 1,
}: {
  position: [number, number, number];
  scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.22, 0.7, 6]} />
        <meshStandardMaterial color="#7a5230" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <coneGeometry args={[0.9, 1.3, 7]} />
        <meshStandardMaterial color="#4f9e44" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 1.85, 0]} castShadow>
        <coneGeometry args={[0.62, 1.0, 7]} />
        <meshStandardMaterial color="#438a3a" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

/** GLB path: render a loaded island model in place of the primitives. */
function IslandModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene as Group} />;
}

// Re-export the surface heights so zone components can sit props on the
// plateau without hard-coding magic numbers.
export { GRASS_TOP, SAND_TOP };
