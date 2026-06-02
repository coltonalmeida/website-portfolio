import Building, { type BuildingProps } from "./Building";

/**
 * Ambient (non-interactive) city detail that fills out the Toronto skyline and
 * streets around the four clickable landmarks: a spread of varied towers,
 * street lamps with warm pools of light, parked cars with head/tail lights,
 * a small park of trees, and a glowing billboard. Density beats emptiness —
 * everything here is deterministic so the scene is stable across reloads.
 */

// Background skyline + block-fill towers (kept clear of the zone footprints:
// CN Tower ~[-2.5,-3], Financial District ~[4.8,-4.5], Skills ~[-6.5,1.8],
// Contact dock ~[2.5,6.5]).
const BUILDINGS: BuildingProps[] = [
  { position: [-9, 0, -9], size: [1.6, 3.6, 1.6], seed: 31, rooftop: "water-tower" },
  { position: [-7, 0, -9.3], size: [1.4, 2.8, 1.4], seed: 32 },
  { position: [-4.6, 0, -9], size: [1.5, 4.4, 1.5], seed: 33, rooftop: "antenna" },
  { position: [-1, 0, -9.3], size: [1.6, 3.2, 1.6], seed: 34, rooftop: "water-tower" },
  { position: [1.6, 0, -9], size: [1.5, 5.2, 1.5], seed: 35, rooftop: "antenna" },
  { position: [7.6, 0, -9], size: [1.7, 4.6, 1.7], seed: 36, rooftop: "water-tower" },
  { position: [9.6, 0, -8.6], size: [1.4, 3.0, 1.4], seed: 37 },
  { position: [-9.2, 0, -5.5], size: [1.4, 2.6, 1.4], seed: 38 },
  { position: [8.6, 0, -5.5], size: [1.5, 3.6, 1.5], seed: 39, rooftop: "water-tower" },
  { position: [-9.6, 0, -1], size: [1.3, 2.2, 1.3], seed: 40, color: "#241616" },
  { position: [8.8, 0, -1], size: [1.4, 2.8, 1.4], seed: 41 },
  { position: [8.2, 0, 2.6], size: [1.3, 2.0, 1.3], seed: 42, color: "#221717" },
];

const LAMPS: { x: number; z: number; cast?: boolean }[] = [
  { x: -8, z: 2.6, cast: true },
  { x: -4, z: 2.6 },
  { x: 0, z: 2.6, cast: true },
  { x: 4, z: 2.6 },
  { x: 8, z: 2.6, cast: true },
  { x: -2.5, z: -1.5 },
  { x: -2.5, z: -6 },
];

const CARS: { x: number; z: number; rot: number; color: string }[] = [
  { x: -6, z: 1.2, rot: 0, color: "#2e5a8f" },
  { x: 2, z: 1.8, rot: Math.PI, color: "#8f2e2e" },
  { x: 6, z: 1.2, rot: 0, color: "#cfd3da" },
  { x: -1, z: -1, rot: Math.PI / 2, color: "#2e8f5a" },
  { x: -1, z: -5, rot: Math.PI / 2, color: "#444a55" },
];

const TREES: { x: number; z: number; s: number }[] = [
  { x: -9, z: 3.2, s: 1 },
  { x: -9.8, z: 3.9, s: 0.8 },
  { x: -8.3, z: 3.7, s: 0.9 },
  { x: 6.4, z: 3.4, s: 0.95 },
  { x: 5.4, z: 2.9, s: 0.8 },
];

export default function City() {
  return (
    <group>
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
      <Billboard position={[3.5, 0, 2.2]} />
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
        <meshStandardMaterial
          color="#fff1c4"
          emissive="#ffdf94"
          emissiveIntensity={2.4}
        />
      </mesh>
      {cast && (
        <pointLight
          position={[0.45, 2.0, 0]}
          intensity={3}
          distance={6}
          color="#ffce80"
        />
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
      {/* Headlights (front, +z) */}
      {[0.2, -0.2].map((x) => (
        <mesh key={`h${x}`} position={[x, 0.24, 0.61]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#fff6d8" emissive="#fff0c0" emissiveIntensity={2.5} />
        </mesh>
      ))}
      {/* Taillights (rear, -z) */}
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

/** A glowing roadside billboard with a red maple-leaf accent panel. */
function Billboard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.1, 1.6, 0.1]} />
        <meshStandardMaterial color="#23303a" flatShading />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[1.6, 0.9, 0.08]} />
        <meshStandardMaterial
          color="#1a0606"
          emissive="#ff3b3b"
          emissiveIntensity={1.4}
        />
      </mesh>
    </group>
  );
}
