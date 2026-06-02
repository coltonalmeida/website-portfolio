import Building, { type BuildingProps } from "./Building";
import CNTower from "./CNTower";
import { TOWER_POSITION } from "@/lib/zones";

/**
 * The CN Tower centerpiece plus all ambient (non-interactive) city detail that
 * fills the bigger Toronto map around the four clickable landmarks: a Financial
 * District cluster, a north skyline, mid/waterfront fill, a red TTC streetcar,
 * street lamps, cars, trees, and billboards. Everything is deterministic.
 *
 * Clear of the land zones — Union Station ~[-10,0], Construction ~[7.5,-2.5],
 * and the CN Tower / Skills ticker at [0,-5].
 */
const BUILDINGS: BuildingProps[] = [
  // Financial District (NE, tall)
  { position: [13.5, 0, -15], size: [2.0, 8.5, 2.0], seed: 51, rooftop: "antenna" },
  { position: [15.8, 0, -13], size: [1.8, 6.8, 1.8], seed: 52, rooftop: "water-tower" },
  { position: [14.5, 0, -11.5], size: [1.6, 5.6, 1.6], seed: 53 },
  { position: [16.6, 0, -16], size: [1.7, 7.4, 1.7], seed: 54, rooftop: "antenna" },
  // North skyline
  { position: [-15, 0, -14], size: [1.8, 5.2, 1.8], seed: 55, rooftop: "water-tower" },
  { position: [-12, 0, -15.5], size: [1.6, 6.0, 1.6], seed: 56, rooftop: "antenna" },
  { position: [-16.5, 0, -11], size: [1.5, 3.6, 1.5], seed: 57 },
  { position: [-9, 0, -14], size: [1.7, 4.6, 1.7], seed: 58, rooftop: "water-tower" },
  { position: [-3, 0, -14], size: [1.8, 5.4, 1.8], seed: 59, rooftop: "antenna" },
  { position: [1.5, 0, -15], size: [1.6, 4.2, 1.6], seed: 60 },
  { position: [-5, 0, -11], size: [1.5, 3.4, 1.5], seed: 61 },
  { position: [8, 0, -14], size: [1.7, 5.0, 1.7], seed: 62, rooftop: "water-tower" },
  { position: [10.5, 0, -15.5], size: [1.6, 4.0, 1.6], seed: 63 },
  { position: [5.5, 0, -11], size: [1.5, 3.6, 1.5], seed: 64 },
  // Mid-band fill (east + west)
  { position: [14.5, 0, -4], size: [1.6, 4.4, 1.6], seed: 65, rooftop: "water-tower" },
  { position: [16.6, 0, -1.5], size: [1.5, 3.2, 1.5], seed: 66 },
  { position: [-16, 0, -4.5], size: [1.5, 3.0, 1.5], seed: 67, color: "#241616" },
  { position: [-16.6, 0, -1], size: [1.4, 2.6, 1.4], seed: 68 },
  // Waterfront low-rise
  { position: [-4, 0, 4.4], size: [1.6, 2.4, 1.6], seed: 69, color: "#221717" },
  { position: [6.5, 0, 4.3], size: [1.5, 2.0, 1.5], seed: 70 },
  { position: [10, 0, 4], size: [1.5, 2.6, 1.5], seed: 71 },
];

const LAMPS: { x: number; z: number; cast?: boolean }[] = [
  { x: -15, z: 3.4, cast: true },
  { x: -9, z: 3.4 },
  { x: -3, z: 3.4, cast: true },
  { x: 1, z: 3.4 },
  { x: 8, z: 3.4, cast: true },
  { x: 15, z: 3.4 },
  { x: -12, z: -6.6 },
  { x: -3, z: -6.6, cast: true },
  { x: 6, z: -6.6 },
  { x: 14, z: -6.6 },
];

const CARS: { x: number; z: number; rot: number; color: string }[] = [
  { x: -6, z: 1.4, rot: 0, color: "#2e5a8f" },
  { x: 2, z: 2.6, rot: Math.PI, color: "#8f2e2e" },
  { x: 11, z: 1.4, rot: 0, color: "#cfd3da" },
  { x: 4, z: -3, rot: Math.PI / 2, color: "#2e8f5a" },
  { x: 4, z: -12, rot: Math.PI / 2, color: "#444a55" },
  { x: -7, z: -5, rot: Math.PI / 2, color: "#b59a2a" },
];

const TREES: { x: number; z: number; s: number }[] = [
  { x: -15, z: 3.2, s: 1 },
  { x: -16.2, z: 4, s: 0.8 },
  { x: -14, z: 4.3, s: 0.9 },
  { x: 13, z: 3.5, s: 0.95 },
  { x: 15, z: 4, s: 0.8 },
  { x: -1, z: 5.8, s: 0.9 },
  { x: 1, z: 5.5, s: 0.85 },
];

export default function City() {
  return (
    <group>
      {/* Skyline centerpiece */}
      <group position={TOWER_POSITION}>
        <CNTower />
      </group>

      {BUILDINGS.map((b, i) => (
        <Building key={i} {...b} />
      ))}
      {LAMPS.map((l, i) => (
        <Lamp key={i} position={[l.x, 0, l.z]} cast={l.cast} />
      ))}
      {CARS.map((c, i) => (
        <Car key={i} position={[c.x, 0, c.z]} rotation={c.rot} color={c.color} />
      ))}
      {TREES.map((t, i) => (
        <Tree key={i} position={[t.x, 0, t.z]} scale={t.s} />
      ))}

      <Streetcar position={[-2, 0, 2]} />
      <Billboard position={[5, 0, 3.4]} />
      <Billboard position={[-6, 0, -9]} />
    </group>
  );
}

/** Ambient TTC streetcar on the main avenue. */
function Streetcar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.78, 0]} castShadow>
        <boxGeometry args={[3.4, 0.9, 1.05]} />
        <meshStandardMaterial color="#c0392b" flatShading roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.98, 0]}>
        <boxGeometry args={[3.0, 0.34, 1.08]} />
        <meshStandardMaterial color="#1a1407" emissive="#ffcf7a" emissiveIntensity={1.3} flatShading />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[3.2, 0.16, 0.95]} />
        <meshStandardMaterial color="#8f291f" flatShading />
      </mesh>
      {[1.72, -1.72].map((x) => (
        <mesh key={x} position={[x, 0.7, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#fff6d8" emissive="#fff0c0" emissiveIntensity={2.4} />
        </mesh>
      ))}
    </group>
  );
}

function Lamp({
  position,
  cast,
}: {
  position: [number, number, number];
  cast?: boolean;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 2.2, 6]} />
        <meshStandardMaterial color="#2a313d" flatShading roughness={1} />
      </mesh>
      <mesh position={[0.25, 2.15, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.12]} />
        <meshStandardMaterial color="#2a313d" flatShading />
      </mesh>
      <mesh position={[0.45, 2.05, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#fff1c4" emissive="#ffdf94" emissiveIntensity={2.4} />
      </mesh>
      {cast && (
        <pointLight position={[0.45, 2.0, 0]} intensity={3} distance={6} color="#ffce80" />
      )}
    </group>
  );
}

function Car({
  position,
  rotation,
  color,
}: {
  position: [number, number, number];
  rotation: number;
  color: string;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.62, 0.3, 1.2]} />
        <meshStandardMaterial color={color} flatShading roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.46, -0.05]} castShadow>
        <boxGeometry args={[0.56, 0.26, 0.66]} />
        <meshStandardMaterial color={color} flatShading roughness={0.6} />
      </mesh>
      {[0.2, -0.2].map((x) => (
        <mesh key={`h${x}`} position={[x, 0.24, 0.61]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#fff6d8" emissive="#fff0c0" emissiveIntensity={2.5} />
        </mesh>
      ))}
      {[0.2, -0.2].map((x) => (
        <mesh key={`t${x}`} position={[x, 0.24, -0.61]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color="#ff4040" emissive="#ff2020" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

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
        <cylinderGeometry args={[0.1, 0.14, 0.7, 6]} />
        <meshStandardMaterial color="#3a2a1c" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <coneGeometry args={[0.55, 1.0, 7]} />
        <meshStandardMaterial color="#1f3a24" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 1.45, 0]} castShadow>
        <coneGeometry args={[0.4, 0.8, 7]} />
        <meshStandardMaterial color="#24432a" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

function Billboard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.1, 1.6, 0.1]} />
        <meshStandardMaterial color="#23303a" flatShading />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[1.6, 0.9, 0.08]} />
        <meshStandardMaterial color="#1a0606" emissive="#ff3b3b" emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}
