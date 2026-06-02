import Building, { type BuildingProps } from "./Building";
import CNTower from "./CNTower";
import CNTowerModel from "./CNTowerModel";
import { TOWER_POSITION } from "@/lib/zones";
import {
  DISTRICTS,
  CARS as CAR_SLOTS,
  carTransform,
  hash2,
  isReserved,
  isOnRoad,
  MAIN_AVENUE_Z,
  TRAFFIC_LIGHTS,
} from "@/lib/cityGrid";
import TrafficLight from "./TrafficLight";

/**
 * The real Sketchfab CN Tower GLB ("CN Tower" by nidhi3ds, CC-BY) lives at
 * `public/models/cn-tower.glb`. The raw model is offset far from the origin and
 * its base sits at y≈2.05 — these measured constants (from the GLB bbox) let us
 * recentre its footprint over the tower position and drop its base onto the
 * platform, so tuning the look is just the single `TOWER_MODEL_SCALE` knob.
 */
const HAS_TOWER_MODEL = true;
const TOWER_MODEL_SCALE = 1.15;
const TOWER_MODEL_CENTER_XZ: [number, number] = [156.401, 25.445];
// Base disc is hidden in CNTowerModel, so the lowest tower geometry is now the
// shaft foot at model-y ≈ 3.5 — anchor that to the platform.
const TOWER_MODEL_BASE_Y = 3.5;
const TOWER_MODEL_OFFSET: [number, number, number] = [
  -TOWER_MODEL_SCALE * TOWER_MODEL_CENTER_XZ[0],
  -TOWER_MODEL_SCALE * TOWER_MODEL_BASE_Y,
  -TOWER_MODEL_SCALE * TOWER_MODEL_CENTER_XZ[1],
];

/**
 * The CN Tower centerpiece plus all ambient (non-interactive) city detail that
 * fills the bigger Toronto map around the four clickable landmarks: a Financial
 * District cluster, a north skyline, mid/waterfront fill, a red TTC streetcar,
 * street lamps, cars, trees, and billboards. Everything is deterministic.
 *
 * Clear of the land zones — Union Station ~[-10,0], Construction ~[7.5,-2.5],
 * and the CN Tower / Skills ticker at [0,-5].
 */
// Buildings bunch into dense districts — each district packs a tight cols×rows
// of towers (with jitter so it isn't a rigid grid), giving real downtown blocks
// instead of lonely buildings. Any that land on a road or a landmark are dropped.
const BUILDINGS: BuildingProps[] = DISTRICTS.flatMap((d, di) => {
  const out: BuildingProps[] = [];
  for (let i = 0; i < d.cols; i++) {
    for (let j = 0; j < d.rows; j++) {
      const cellX = d.cx + (i - (d.cols - 1) / 2) * d.dx;
      const cellZ = d.cz + (j - (d.rows - 1) / 2) * d.dz;
      const r1 = hash2(cellX, cellZ);
      const r2 = hash2(cellX + 2.3, cellZ - 1.7);
      const r3 = hash2(cellX - 5.1, cellZ + 3.3);
      const r4 = hash2(cellX + 7.7, cellZ + 9.1);
      const x = cellX + (r1 - 0.5) * 0.7;
      const z = cellZ + (r2 - 0.5) * 0.7;
      if (isReserved(x, z, 0.5) || isOnRoad(x, z, 1.0)) continue;
      const h = d.hMin + r3 * (d.hMax - d.hMin);
      out.push({
        position: [x, 0, z] as [number, number, number],
        size: [1.9 + r4 * 0.7, h, 1.7 + r1 * 0.6] as [number, number, number],
        seed: Math.floor(r3 * 9973) + di * 97 + i * 7 + j,
        rooftop: r4 < 0.25 ? "antenna" : r4 < 0.5 ? "water-tower" : "none",
      });
    }
  }
  return out;
});

// Street lamps along the south side of the main avenue, skipping crossings.
const LAMPS = [-22, -16, -6, 0, 6, 16, 22]
  .map((x, i) => ({ x, z: MAIN_AVENUE_Z + 1.7, cast: i % 2 === 0 }))
  .filter((l) => !isOnRoad(l.x, l.z, 0.4));

// A small waterfront tree line, clear of the low-rise row and the streets.
const TREES: { x: number; z: number; s: number }[] = [
  { x: -8, z: 6.3, s: 1.0 },
  { x: -2, z: 6.3, s: 0.85 },
  { x: 4, z: 6.3, s: 0.95 },
  { x: 21, z: 6.0, s: 0.9 },
  { x: -23, z: 6.0, s: 0.8 },
];

export default function City() {
  return (
    <group>
      {/* Skyline centerpiece — real GLB when present, else primitive tower */}
      <group position={TOWER_POSITION}>
        <CNTowerModel
          enabled={HAS_TOWER_MODEL}
          fallback={<CNTower />}
          scale={TOWER_MODEL_SCALE}
          position={TOWER_MODEL_OFFSET}
        />
        {/* Light the tower — its GLB materials read near-black under the low
            night ambient, so give it a cool key, a warm rim, and a base uplight. */}
        <pointLight position={[7, 11, 9]} intensity={55} distance={40} color="#bcd0ff" />
        <pointLight position={[-6, 14, -5]} intensity={32} distance={34} color="#ffd2a0" />
        <pointLight position={[0, 2, 3]} intensity={26} distance={20} color="#ffb878" />
      </group>

      {BUILDINGS.map((b, i) => (
        <Building key={i} {...b} />
      ))}
      {LAMPS.map((l, i) => (
        <Lamp key={i} position={[l.x, 0, l.z]} cast={l.cast} />
      ))}
      {CAR_SLOTS.map((c, i) => {
        const { position, rotation } = carTransform(c);
        return (
          <Car key={i} position={position} rotation={rotation} color={c.color} />
        );
      })}
      {TREES.map((t, i) => (
        <Tree key={i} position={[t.x, 0, t.z]} scale={t.s} />
      ))}
      {/* GLB traffic lights standing at the main intersections. */}
      {TRAFFIC_LIGHTS.map((t, i) => (
        <TrafficLight key={i} position={[t.x, 0, t.z]} rotation={t.rot} />
      ))}

      {/* TTC streetcar running along the main avenue. */}
      <Streetcar position={[-2, 0, MAIN_AVENUE_Z]} />
      {/* Billboards in the open CN Tower plaza (clear of roads + buildings). */}
      <Billboard position={[3, 0, -7]} />
      <Billboard position={[-4, 0, -2]} />
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
