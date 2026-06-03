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
  isNearIntersection,
  ROADS,
  SIGNALS,
} from "@/lib/cityGrid";
import TrafficSignal from "./TrafficSignal";
import StreetLight from "./StreetLight";

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
 * District cluster, a north skyline, mid/waterfront fill, GLB street lamps, GLB
 * mast-arm traffic signals, cars, trees, and street furniture. All deterministic.
 *
 * Clear of the land zones — Union Station (west), Construction (east), the CN
 * Tower at [0,-5], and the Skills billboard plaza just south of it.
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

// True if (x, z) falls inside any ambient building/hero-tower footprint (plus a
// margin) — used to keep curb lamps from clipping into buildings.
function insideBuilding(x: number, z: number, margin: number): boolean {
  for (const b of BUILDINGS) {
    if (
      Math.abs(x - b.position[0]) < b.size[0] / 2 + margin &&
      Math.abs(z - b.position[2]) < b.size[2] / 2 + margin
    )
      return true;
  }
  for (const h of HEROES) {
    if (
      Math.abs(x - h.position[0]) < h.foot / 2 + margin &&
      Math.abs(z - h.position[2]) < h.foot / 2 + margin
    )
      return true;
  }
  return false;
}

// GLB street lamps placed along every road's curbs at a steady spacing, set
// back onto the sidewalk and skipping intersections (those get traffic signals)
// and the landmark plazas. A deterministic mix of variants keeps it varied, and
// only a subset cast a real point light so the scene isn't flooded with lights.
const LAMP_VARIANTS = [
  "FarolaDe1",
  "FarolaDe4",
  "FarolaModernaDe1",
  "FarolaModernaDe2",
  "FarolaModernaBola",
];
const STREET_LIGHTS: {
  x: number;
  z: number;
  rot: number;
  variant: string;
  cast: boolean;
}[] = (() => {
  const out: { x: number; z: number; rot: number; variant: string; cast: boolean }[] = [];
  const SPACING = 8;
  for (const r of ROADS) {
    const off = r.width / 2 + 0.55; // out to the sidewalk
    const len = r.to - r.from;
    const n = Math.max(1, Math.round(len / SPACING));
    for (let i = 1; i < n; i++) {
      const along = r.from + i * (len / n);
      for (const side of [off, -off]) {
        const x = r.axis === "x" ? along : r.along + side;
        const z = r.axis === "x" ? r.along + side : along;
        if (isNearIntersection(x, z, 3.5)) continue;
        if (isReserved(x, z, 1)) continue;
        if (isOnRoad(x, z, 0.1)) continue;
        if (insideBuilding(x, z, 0.4)) continue;
        // Face the lamp arm toward the road centre.
        const rot =
          r.axis === "x"
            ? side > 0
              ? Math.PI
              : 0
            : side > 0
              ? -Math.PI / 2
              : Math.PI / 2;
        const h = hash2(x, z);
        out.push({
          x,
          z,
          rot,
          variant: LAMP_VARIANTS[Math.floor(h * LAMP_VARIANTS.length) % LAMP_VARIANTS.length],
          cast: hash2(x + 3.1, z - 2.7) < 0.34,
        });
      }
    }
  }
  return out;
})();

// A waterfront tree line / park strip along the south edge — denser so the
// foreground in the home framing isn't dead space.
const TREES: { x: number; z: number; s: number }[] = [
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
      {STREET_LIGHTS.map((l, i) => (
        <StreetLight
          key={i}
          position={[l.x, 0, l.z]}
          rotation={l.rot}
          variant={l.variant}
          cast={l.cast}
        />
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
      {/* Overhead mast-arm traffic signals at the main intersections — one per
          one-way approach, cycling red/amber/green (see TrafficSignal). */}
      {SIGNALS.map((s, i) => (
        <TrafficSignal key={i} position={[s.x, 0, s.z]} rotation={s.rot} phase={s.phase} />
      ))}

      {/* Street furniture — small props that dress the sidewalks and plaza. */}
      {HYDRANTS.map((p, i) => (
        <Hydrant key={i} position={[p.x, 0, p.z]} />
      ))}
      {TRASH_CANS.map((p, i) => (
        <TrashCan key={i} position={[p.x, 0, p.z]} />
      ))}
      {PLANTERS.map((p, i) => (
        <Planter key={i} position={[p.x, 0, p.z]} />
      ))}
      {BOLLARDS.map((p, i) => (
        <Bollard key={i} position={[p.x, 0, p.z]} />
      ))}
      {NEWSPAPER_BOXES.map((p, i) => (
        <NewspaperBox key={i} position={[p.x, 0, p.z]} rotation={p.rot} color={p.color} />
      ))}
      <BusShelter position={[-6.5, 0, 3.9]} rotation={Math.PI} />
      <HotDogCart position={[6, 0, 3.9]} rotation={Math.PI} />
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

/* ----------------------------------------------------------- street props -- */

// Hand-placed street furniture, all on sidewalks just off the road edges and
// clear of the landmark plazas.
const HYDRANTS: { x: number; z: number }[] = [
  { x: -15.5, z: 3.9 },
  { x: 6.5, z: 3.9 }, // moved off the east street (x=10)
  { x: 13.5, z: -11 },
  { x: -9.5, z: -11 },
  { x: -23, z: -11 },
];

const TRASH_CANS: { x: number; z: number }[] = [
  { x: -3, z: 3.9 },
  { x: 13.5, z: 3.9 }, // moved off the east street (x=10)
  { x: 4, z: -11 },
];

// Planters flanking the Skills sign plaza + a couple along the waterfront.
const PLANTERS: { x: number; z: number }[] = [
  { x: -5.6, z: -0.5 }, // beside the sign, clear of the avenue edge
  { x: 3.4, z: -0.5 },
  { x: 16, z: 3.9 },
  { x: -19, z: 3.9 },
];

// A short run of bollards lining the plaza front so it reads as a pedestrian
// square edge.
// Security bollards lining the Union Station forecourt (off-road, in front of
// the station / GO-train, clear of every road).
const BOLLARDS: { x: number; z: number }[] = [-23, -21, -19, -17, -15].map((x) => ({
  x,
  z: -0.8,
}));

const NEWSPAPER_BOXES: { x: number; z: number; rot: number; color: string }[] = [
  { x: -2, z: 3.95, rot: Math.PI, color: "#c0392b" },
  { x: -1.4, z: 3.95, rot: Math.PI, color: "#2e5a8f" },
  { x: 12, z: -11, rot: -Math.PI / 2, color: "#1f7a4d" },
];

/** A short Toronto-red fire hydrant. */
function Hydrant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.4, 8]} />
        <meshStandardMaterial color="#c0392b" flatShading roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshStandardMaterial color="#c0392b" flatShading roughness={0.8} />
      </mesh>
      {[0.11, -0.11].map((x) => (
        <mesh key={x} position={[x, 0.26, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 0.08, 6]} />
          <meshStandardMaterial color="#8f291f" flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** A small sidewalk trash can with a lid. */
function TrashCan({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.16, 0.6, 8]} />
        <meshStandardMaterial color="#2c333d" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 8]} />
        <meshStandardMaterial color="#3a424e" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

/** A square concrete planter with a low shrub. */
function Planter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.36, 0.6]} />
        <meshStandardMaterial color="#3b4250" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <sphereGeometry args={[0.26, 7, 6]} />
        <meshStandardMaterial color="#214a2c" flatShading roughness={1} />
      </mesh>
    </group>
  );
}

/** A short reflective bollard. */
function Bollard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.44, 8]} />
        <meshStandardMaterial color="#3a414c" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.05, 8]} />
        <meshStandardMaterial color="#0c0f18" emissive="#ffd98a" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

/** A coin-operated newspaper box. */
function NewspaperBox({
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
      <mesh position={[0, 0.34, 0]} castShadow>
        <boxGeometry args={[0.36, 0.68, 0.3]} />
        <meshStandardMaterial color={color} flatShading roughness={0.8} />
      </mesh>
      {/* Glass display panel */}
      <mesh position={[0, 0.45, 0.16]}>
        <boxGeometry args={[0.26, 0.3, 0.02]} />
        <meshStandardMaterial color="#0c0f16" emissive="#9fb6cf" emissiveIntensity={0.5} />
      </mesh>
      {[0.13, -0.13].map((x) => (
        <mesh key={x} position={[x, 0.04, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.08, 6]} />
          <meshStandardMaterial color="#1a1d24" flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** A glass TTC bus shelter with a lit advert panel and a bench. */
function BusShelter({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Roof */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[2.2, 0.1, 1.0]} />
        <meshStandardMaterial color="#2a313d" flatShading roughness={1} />
      </mesh>
      {/* Back glass wall (faintly lit) */}
      <mesh position={[0, 0.85, -0.45]}>
        <boxGeometry args={[2.2, 1.3, 0.04]} />
        <meshStandardMaterial color="#0e1620" emissive="#3a5168" emissiveIntensity={0.35} transparent opacity={0.85} />
      </mesh>
      {/* Lit advert panel on the right end */}
      <mesh position={[1.05, 0.85, 0]}>
        <boxGeometry args={[0.06, 1.2, 0.85]} />
        <meshStandardMaterial color="#1a1305" emissive="#ffd98a" emissiveIntensity={1.1} />
      </mesh>
      {/* Left support post */}
      <mesh position={[-1.05, 0.75, 0]} castShadow>
        <boxGeometry args={[0.08, 1.5, 0.08]} />
        <meshStandardMaterial color="#2a313d" flatShading />
      </mesh>
      {/* Bench inside */}
      <mesh position={[0, 0.35, -0.28]} castShadow>
        <boxGeometry args={[1.7, 0.08, 0.32]} />
        <meshStandardMaterial color="#3a414c" flatShading />
      </mesh>
      <pointLight position={[0.9, 1.2, 0.2]} intensity={1.6} distance={4} color="#ffe6ad" />
    </group>
  );
}

/** A Toronto street-meat hot dog cart with a warm interior glow + umbrella. */
function HotDogCart({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Cart body */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.2, 0.5, 0.6]} />
        <meshStandardMaterial color="#d7dadf" flatShading roughness={0.6} />
      </mesh>
      {/* Red trim / signboard */}
      <mesh position={[0, 0.86, 0.31]}>
        <boxGeometry args={[1.2, 0.16, 0.04]} />
        <meshStandardMaterial color="#1a0a06" emissive="#ff6a3d" emissiveIntensity={1.2} />
      </mesh>
      {/* Wheels */}
      {[0.45, -0.45].map((x) => (
        <mesh key={x} position={[x, 0.2, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 12]} />
          <meshStandardMaterial color="#14161c" flatShading />
        </mesh>
      ))}
      {/* Umbrella pole + canopy */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
        <meshStandardMaterial color="#3a414c" flatShading />
      </mesh>
      <mesh position={[0, 1.78, 0]} castShadow>
        <coneGeometry args={[0.95, 0.4, 4]} />
        <meshStandardMaterial color="#c0392b" flatShading roughness={0.8} />
      </mesh>
      {/* Warm cooking glow */}
      <pointLight position={[0, 0.9, 0]} intensity={2} distance={3.5} color="#ffb066" />
    </group>
  );
}
