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
import BillboardModel from "./BillboardModel";

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

// A handful of unique "hero" towers in the financial core — taller, with a
// distinct tint, a setback crown and a lit accent band + spire — so the skyline
// has landmarks instead of one repeated box. Hand-placed in spots clear of the
// roads/reserved landmark footprints.
const HEROES: {
  position: [number, number, number];
  height: number;
  foot: number;
  seed: number;
  tint: string;
  accent: string;
}[] = [
  { position: [-2.5, 0, -16], height: 14, foot: 2.4, seed: 4201, tint: "#15110b", accent: "#ffcf6b" },
  { position: [3.6, 0, -18.4], height: 12.5, foot: 2.1, seed: 7717, tint: "#0d1018", accent: "#bfe0ff" },
  { position: [-7.2, 0, -16.6], height: 11, foot: 2.0, seed: 9043, tint: "#141019", accent: "#ff9ec4" },
];

// Street lamps along the south side of the main avenue, skipping crossings.
const LAMPS = [-22, -16, -6, 0, 6, 16, 22]
  .map((x, i) => ({ x, z: MAIN_AVENUE_Z + 1.7, cast: i % 2 === 0 }))
  .filter((l) => !isOnRoad(l.x, l.z, 0.4));

// A waterfront tree line / park strip along the south edge — denser so the
// foreground in the home framing isn't dead space.
const TREES: { x: number; z: number; s: number }[] = [
  { x: -11, z: 6.4, s: 1.0 },
  { x: -8, z: 6.2, s: 0.8 },
  { x: -5, z: 6.4, s: 0.95 },
  { x: -2, z: 6.2, s: 0.85 },
  { x: 1, z: 6.4, s: 1.0 },
  { x: 4, z: 6.2, s: 0.9 },
  { x: 7, z: 6.4, s: 0.85 },
  { x: 21, z: 6.0, s: 0.9 },
  { x: 24, z: 6.2, s: 0.8 },
  { x: -23, z: 6.0, s: 0.8 },
  { x: -20, z: 6.2, s: 0.9 },
];

// A couple of park benches facing the lake in the waterfront strip.
const BENCHES: { x: number; z: number; rot: number }[] = [
  { x: -3.5, z: 5.4, rot: 0 },
  { x: 2.5, z: 5.4, rot: 0 },
  { x: 5.5, z: 5.4, rot: 0 },
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
        {/* Light the tower as a bright centerpiece with real cylindrical
            contrast: a strong near-neutral key from the south-east, a softer
            warm rim on the city-facing (north-west) edge so it sits in the warm
            cityscape, a warm base uplight, and a gentle high fill on the SkyPod.
            (The pod glow + red beacon come from the model's own accents.) */}
        <pointLight position={[9, 12, 10]} intensity={28} distance={48} color="#dce2ee" />
        <pointLight position={[-7, 15, -6]} intensity={20} distance={42} color="#ffce9c" />
        <pointLight position={[0, 2, 3]} intensity={26} distance={26} color="#ffb878" />
        <pointLight position={[0, 16, 5]} intensity={12} distance={28} color="#e6ecf6" />
      </group>

      {BUILDINGS.map((b, i) => (
        <Building key={i} {...b} />
      ))}
      {HEROES.map((hbld, i) => (
        <HeroTower key={`hero-${i}`} {...hbld} />
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
      {BENCHES.map((b, i) => (
        <Bench key={i} position={[b.x, 0, b.z]} rotation={b.rot} />
      ))}
      {/* GLB traffic lights standing at the main intersections, each casting a
          small green "go" light pool onto the asphalt. */}
      {TRAFFIC_LIGHTS.map((t, i) => (
        <group key={i}>
          <TrafficLight position={[t.x, 0, t.z]} rotation={t.rot} />
          <pointLight position={[t.x, 1.6, t.z]} intensity={1.6} distance={4.5} color="#39d353" />
        </group>
      ))}

      {/* TTC streetcar running along the main avenue, on its tracks. */}
      <StreetcarTrack from={-12} to={8} z={MAIN_AVENUE_Z} />
      <Streetcar position={[-2, 0, MAIN_AVENUE_Z]} />
      {/* A single billboard in the plaza, facing the main avenue (south). */}
      <BillboardModel position={[3, 0, -1]} rotation={0} />
    </group>
  );
}

/**
 * A unique skyline landmark tower: a tinted shaft of lit windows (via Building),
 * a setback concrete crown, a glowing accent band, and an antenna with a red
 * aviation light — so a few towers actually stand out from the repeated boxes.
 */
function HeroTower({
  position,
  height,
  foot,
  seed,
  tint,
  accent,
}: {
  position: [number, number, number];
  height: number;
  foot: number;
  seed: number;
  tint: string;
  accent: string;
}) {
  return (
    <group position={position}>
      <Building
        position={[0, 0, 0]}
        size={[foot, height, foot]}
        seed={seed}
        color={tint}
        litChance={0.5}
      />
      {/* Setback crown */}
      <mesh position={[0, height + 0.55, 0]} castShadow>
        <boxGeometry args={[foot * 0.62, 1.0, foot * 0.62]} />
        <meshStandardMaterial color="#1a2030" flatShading roughness={1} />
      </mesh>
      {/* Glowing accent band on the crown */}
      <mesh position={[0, height + 0.2, 0]}>
        <boxGeometry args={[foot * 0.66, 0.18, foot * 0.66]} />
        <meshStandardMaterial color="#0c0f1a" emissive={accent} emissiveIntensity={1.6} flatShading />
      </mesh>
      {/* Antenna + aviation light */}
      <mesh position={[0, height + 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.06, 1.6, 6]} />
        <meshStandardMaterial color="#3b4252" flatShading />
      </mesh>
      <mesh position={[0, height + 2.45, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ff3b3b" emissive="#ff2222" emissiveIntensity={2.4} />
      </mesh>
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

/** A simple low-poly park bench (slats + two legs). */
function Bench({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[1.1, 0.08, 0.34]} />
        <meshStandardMaterial color="#5a3a22" flatShading roughness={1} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.5, -0.14]} castShadow>
        <boxGeometry args={[1.1, 0.32, 0.06]} />
        <meshStandardMaterial color="#5a3a22" flatShading roughness={1} />
      </mesh>
      {/* Legs */}
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.14, 0]}>
          <boxGeometry args={[0.08, 0.28, 0.32]} />
          <meshStandardMaterial color="#2a313d" flatShading />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Streetcar/tram track on the main avenue: two metal rails with periodic
 * sleepers, sitting just above the asphalt so the rail tops catch city light.
 */
function StreetcarTrack({
  from,
  to,
  z,
}: {
  from: number;
  to: number;
  z: number;
}) {
  const gauge = 0.7;
  const length = to - from;
  const mid = (from + to) / 2;
  const tieCount = Math.floor(length / 0.8);
  return (
    <group position={[mid, 0, z]}>
      {[gauge / 2, -gauge / 2].map((dz) => (
        <mesh key={dz} position={[0, 0.075, dz]}>
          <boxGeometry args={[length, 0.05, 0.07]} />
          <meshStandardMaterial
            color="#6b7280"
            emissive="#3a4150"
            emissiveIntensity={0.3}
            metalness={0.6}
            roughness={0.4}
            flatShading
          />
        </mesh>
      ))}
      {Array.from({ length: tieCount }).map((_, i) => {
        const x = from + (i + 0.5) * (length / tieCount) - mid;
        return (
          <mesh key={i} position={[x, 0.06, 0]}>
            <boxGeometry args={[0.14, 0.04, gauge + 0.24]} />
            <meshStandardMaterial color="#241c14" flatShading roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}
