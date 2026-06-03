import { MeshReflectorMaterial, useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import type { Group } from "three";
import {
  LAND,
  ROADS,
  CROSSWALKS,
  roadCrossings,
  type RoadSeg,
} from "@/lib/cityGrid";

/**
 * The Toronto "diorama" base: a raised concrete city platform with a proper
 * street grid (asphalt, lane dashes, crosswalks, raised sidewalks) and a large
 * reflective **Lake Ontario** to the south. The lake is sized so its far edge
 * fogs into the horizon (see Environment) instead of ending abruptly.
 *
 * GLB seam preserved: pass `modelUrl` to swap the primitive base for a model.
 */

// World-Y reference points so props/buildings sit on the right surface.
export const GROUND_Y = 0; // top of the city platform
export const LAKE_Y = -0.3; // lake surface, below the waterfront
export const WATERFRONT_Z = LAND.maxZ; // south edge of the land (lake beyond)

// Platform footprint, derived from the shared city grid.
const PLATFORM_W = LAND.maxX - LAND.minX; // 52
const PLATFORM_D = LAND.maxZ - LAND.minZ; // 33
const PLATFORM_CZ = (LAND.maxZ + LAND.minZ) / 2; // -9.5

type IslandProps = ThreeElements["group"] & {
  modelUrl?: string;
};

export default function Island({ modelUrl, ...groupProps }: IslandProps) {
  return (
    <group {...groupProps}>
      {modelUrl ? <IslandModel url={modelUrl} /> : <CityGround />}
    </group>
  );
}

function CityGround() {
  return (
    <group>
      {/* Lake Ontario — big reflective plane; far edge dissolves into fog. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LAKE_Y, 30]}>
        <planeGeometry args={[400, 400]} />
        <MeshReflectorMaterial
          resolution={512}
          mixBlur={1}
          blur={[400, 120]}
          mirror={0.6}
          mixStrength={2.6}
          color="#0a1430"
          metalness={0.7}
          roughness={0.8}
          depthScale={0}
        />
      </mesh>

      {/* City platform (the land). Top at GROUND_Y = 0. */}
      <mesh position={[0, -0.7, PLATFORM_CZ]} receiveShadow castShadow>
        <boxGeometry args={[PLATFORM_W, 1.4, PLATFORM_D]} />
        <meshStandardMaterial color="#10141d" roughness={1} flatShading />
      </mesh>

      {/* Waterfront seawall lip along the south edge. */}
      <mesh position={[0, -0.1, WATERFRONT_Z]} castShadow receiveShadow>
        <boxGeometry args={[PLATFORM_W, 0.4, 0.6]} />
        <meshStandardMaterial color="#1c2230" roughness={1} flatShading />
      </mesh>

      {/* Irregular arterial roads — raised asphalt with curbs + lane dashes,
          both broken at intersections so crossings stay clean. */}
      {ROADS.map((r, i) => (
        <Road key={i} seg={r} crossings={roadCrossings(r)} />
      ))}

      {/* Zebra crosswalks at every avenue × cross-street intersection. */}
      {CROSSWALKS.map((c, i) => (
        <Crosswalk key={i} position={[c.x, 0.095, c.z]} axis={c.axis} width={c.width} />
      ))}
    </group>
  );
}

/**
 * A raised asphalt road with concrete curbs down both edges and a dashed centre
 * line — a proper 3D street. Curbs and dashes are BROKEN where perpendicular
 * roads cross, so intersections stay clean open asphalt instead of overlapping.
 */
function Road({
  seg,
  crossings,
}: {
  seg: RoadSeg;
  crossings: { at: number; half: number }[];
}) {
  const { axis, along, from, to, width } = seg;
  const length = to - from;
  const mid = (from + to) / 2;
  const horiz = axis === "x";
  // Avenues sit a hair higher than streets so crossings don't z-fight.
  const y = horiz ? 0.06 : 0.05;
  const curbOff = width / 2 + 0.09;

  // Solid stretches between crossings (in world along-coords) for the curbs.
  const sorted = [...crossings].sort((a, b) => a.at - b.at);
  const spans: [number, number][] = [];
  let cur = from;
  for (const c of sorted) {
    const s = c.at - c.half - 0.05;
    if (s > cur) spans.push([cur, s]);
    cur = Math.max(cur, c.at + c.half + 0.05);
  }
  if (cur < to) spans.push([cur, to]);

  // Suppress centre dashes through the whole crossing AND its crosswalk. The
  // crosswalk sits at (perp-road half + 0.7 set-back) with ~0.25 bar half-length
  // (see CROSSWALKS in lib/cityGrid.ts), so its outer edge is ~c.half + 0.95;
  // clear to c.half + 1.1 so no dash bleeds into the crossing.
  const inCrossing = (p: number) =>
    sorted.some((c) => Math.abs(p - c.at) < c.half + 1.1);

  const pos: [number, number, number] = horiz ? [mid, 0, along] : [along, 0, mid];
  const slab: [number, number, number] = horiz
    ? [length, y, width]
    : [width, y, length];
  const dashCount = Math.floor(length / 1.8);

  return (
    <group position={pos}>
      {/* Asphalt slab (full length; higher avenues sit over streets cleanly) */}
      <mesh position={[0, y / 2, 0]} receiveShadow>
        <boxGeometry args={slab} />
        <meshStandardMaterial color="#0a0d14" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Curbs — one box per solid span, per edge (skips intersections) */}
      {spans.map(([s, e], si) =>
        [curbOff, -curbOff].map((o) => {
          const c = (s + e) / 2 - mid;
          const len = e - s;
          return (
            <mesh
              key={`${si}-${o}`}
              position={horiz ? [c, 0.09, o] : [o, 0.09, c]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={horiz ? [len, 0.18, 0.18] : [0.18, 0.18, len]} />
              <meshStandardMaterial color="#2a3040" roughness={1} flatShading />
            </mesh>
          );
        }),
      )}

      {/* Dashed centre line (skips intersections) */}
      {Array.from({ length: dashCount }).map((_, i) => {
        const world = from + (i + 0.5) * (length / dashCount);
        if (inCrossing(world)) return null;
        const o = world - mid;
        const dpos: [number, number, number] = horiz
          ? [o, y + 0.01, 0]
          : [0, y + 0.01, o];
        const dsize: [number, number] = horiz ? [0.7, 0.1] : [0.1, 0.7];
        return (
          <mesh key={i} position={dpos} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={dsize} />
            <meshStandardMaterial
              color="#d8c14a"
              emissive="#d8c14a"
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Zebra crosswalk: white bars laid across the carriageway. `axis` is the road's
 * travel direction — bars run *along* travel (so you step over them crossing)
 * and are arrayed across the road `width`.
 */
function Crosswalk({
  position,
  axis,
  width,
}: {
  position: [number, number, number];
  axis: "x" | "z";
  width: number;
}) {
  const span = width - 0.3; // stay just inside the curbs
  const bars = 6;
  const barLen = 0.5; // bar length along the travel axis
  const barW = 0.26; // bar thickness across the road
  const offsets = Array.from(
    { length: bars },
    (_, i) => -span / 2 + (span / (bars - 1)) * i,
  );
  return (
    <group position={position}>
      {offsets.map((o) => (
        <mesh
          key={o}
          position={axis === "x" ? [0, 0, o] : [o, 0, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry
            args={axis === "x" ? [barLen, barW] : [barW, barLen]}
          />
          <meshStandardMaterial
            color="#cfd6e0"
            emissive="#aab2c0"
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

/** GLB path: render a loaded base model in place of the primitives. */
function IslandModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene as Group} />;
}
