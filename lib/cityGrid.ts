/**
 * Shared Toronto city layout. Roads (in `Island`), bunched building districts,
 * cars, and traffic lights (in `City`) all derive from this so they line up.
 * It is deliberately NOT a perfect square grid — a few irregular arterial roads
 * weave between dense districts, and the three landmark buildings are spread
 * far apart across the midtown band. Units are world units on the platform.
 */

/** Platform footprint. `maxZ` is the waterfront edge (Lake Ontario beyond). */
export const LAND = { minX: -26, maxX: 26, minZ: -26, maxZ: 7 } as const;

/** Deterministic hash in [0,1) from two coordinates (stable per reload). */
export function hash2(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/* ------------------------------------------------------------------ roads -- */

/** A road segment. `axis: "x"` runs E–W at z=`along`; `"z"` runs N–S at x=`along`. */
export interface RoadSeg {
  axis: "x" | "z";
  along: number;
  from: number;
  to: number;
  width: number;
}

export const MAIN_AVENUE_Z = 2;

/**
 * Irregular arterial network — uneven spacing, routed to leave the landmark
 * plaza (centre) clear. Two E–W avenues + a back street, two N–S cross streets.
 */
export const ROADS: RoadSeg[] = [
  { axis: "x", along: MAIN_AVENUE_Z, from: -26, to: 26, width: 3.0 }, // waterfront avenue
  { axis: "x", along: -13, from: -24, to: 24, width: 2.6 }, // midtown avenue
  { axis: "x", along: -22, from: -22, to: 22, width: 2.2 }, // uptown back street
  { axis: "z", along: -12, from: -24, to: 7, width: 2.6 }, // west cross street
  { axis: "z", along: 10, from: -24, to: 7, width: 2.6 }, // east cross street
];

/**
 * Zebra crosswalks at each avenue × cross-street intersection. For every
 * intersection we lay an "L" of two crossings set back onto the road
 * approaches (one across the avenue on its west leg, one across the street on
 * its north leg) so they read as real crossings instead of paint in the middle.
 */
export interface CrosswalkSpec {
  x: number;
  z: number;
  axis: "x" | "z"; // the crossed road's travel direction
  width: number;
}
export const CROSSWALKS: CrosswalkSpec[] = (() => {
  const out: CrosswalkSpec[] = [];
  const avenues = ROADS.filter((r) => r.axis === "x");
  const streets = ROADS.filter((r) => r.axis === "z");
  for (const av of avenues) {
    for (const st of streets) {
      const ix = st.along; // intersection x
      const iz = av.along; // intersection z
      const meets =
        ix > av.from && ix < av.to && iz > st.from && iz < st.to;
      if (!meets) continue;
      // Across the avenue, set back on the west leg.
      out.push({ x: ix - (st.width / 2 + 0.7), z: iz, axis: "x", width: av.width });
      // Across the street, set back on the north leg.
      out.push({ x: ix, z: iz - (av.width / 2 + 0.7), axis: "z", width: st.width });
    }
  }
  return out;
})();

/** Where perpendicular roads cross `seg` (so curbs/dashes can break there). */
export function roadCrossings(seg: RoadSeg): { at: number; half: number }[] {
  return ROADS.filter((o) => o.axis !== seg.axis)
    .filter(
      (o) =>
        o.along > seg.from &&
        o.along < seg.to &&
        seg.along > o.from &&
        seg.along < o.to,
    )
    .map((o) => ({ at: o.along, half: o.width / 2 }));
}

/* -------------------------------------------------------------- districts -- */

/**
 * A bunched cluster of buildings packed onto a tight `cols × rows` sub-grid
 * centred on (cx, cz), so each district reads as a dense block.
 */
export interface District {
  cx: number;
  cz: number;
  cols: number;
  rows: number;
  dx: number;
  dz: number;
  hMin: number;
  hMax: number;
}

export const DISTRICTS: District[] = [
  // Uptown band (north of the midtown avenue) — dense, tall downtown core
  // flanked by two clusters.
  { cx: -1, cz: -17.5, cols: 5, rows: 2, dx: 3.4, dz: 3.0, hMin: 5, hMax: 11 },
  { cx: 17, cz: -17.5, cols: 3, rows: 2, dx: 3.3, dz: 3.0, hMin: 4, hMax: 8 },
  { cx: -18, cz: -17.5, cols: 3, rows: 2, dx: 3.3, dz: 3.0, hMin: 4, hMax: 7 },
  // Midtown fillers in the gaps between the spread-out landmarks — denser so
  // the middle of the map doesn't read as empty around the tower plaza.
  { cx: -8, cz: -2, cols: 3, rows: 2, dx: 2.5, dz: 2.8, hMin: 3, hMax: 7 },
  { cx: 8, cz: -9, cols: 3, rows: 2, dx: 2.5, dz: 2.8, hMin: 3, hMax: 7 },
  { cx: -7, cz: -10, cols: 2, rows: 2, dx: 2.6, dz: 2.8, hMin: 3, hMax: 6 },
  { cx: 7, cz: -2, cols: 2, rows: 2, dx: 2.6, dz: 2.8, hMin: 3, hMax: 6 },
  // Waterfront low-rise (south of the main avenue).
  { cx: -18, cz: 5.2, cols: 3, rows: 1, dx: 3.0, dz: 3.0, hMin: 2, hMax: 3 },
  { cx: 16, cz: 5.2, cols: 3, rows: 1, dx: 3.0, dz: 3.0, hMin: 2, hMax: 3 },
];

/**
 * Landmark footprints kept clear of ambient buildings (x, z, radius). These
 * mirror the zone positions in `lib/zones.ts` — the three big landmark buildings
 * are spread far apart (Union west, tower centre, Construction east).
 */
const RESERVED: { x: number; z: number; r: number }[] = [
  { x: 0, z: -5, r: 6 }, // CN Tower / Skills (centre)
  { x: -19, z: -4, r: 5 }, // Union Station / Experience (west)
  { x: 18, z: -5, r: 5 }, // Construction / Projects (east)
];

export function isReserved(x: number, z: number, pad = 0): boolean {
  return RESERVED.some((p) => Math.hypot(x - p.x, z - p.z) < p.r + pad);
}

/** True if (x, z) lies on (or within `pad` of) any road. */
export function isOnRoad(x: number, z: number, pad = 0): boolean {
  return ROADS.some((r) => {
    const half = r.width / 2 + pad;
    return r.axis === "x"
      ? Math.abs(z - r.along) < half && x > r.from - pad && x < r.to + pad
      : Math.abs(x - r.along) < half && z > r.from - pad && z < r.to + pad;
  });
}

/* ------------------------------------------------------------------- cars -- */

export interface CarSlot {
  axis: "av" | "st"; // on an avenue (E–W) or a street (N–S)
  line: number; // the avenue z or street x
  at: number; // position along the road
  lane: 1 | -1;
  color: string;
}

const LANE = 0.6;

export const CARS: CarSlot[] = [
  { axis: "av", line: MAIN_AVENUE_Z, at: -18, lane: 1, color: "#cfd3da" },
  { axis: "av", line: MAIN_AVENUE_Z, at: 14, lane: -1, color: "#8f2e2e" },
  { axis: "av", line: -13, at: -6, lane: 1, color: "#2e5a8f" },
  { axis: "av", line: -13, at: 18, lane: -1, color: "#b59a2a" },
  { axis: "av", line: -22, at: 4, lane: 1, color: "#2e8f5a" },
  { axis: "st", line: -12, at: -3, lane: 1, color: "#444a55" },
  { axis: "st", line: -12, at: -18, lane: -1, color: "#7a3ca0" },
  { axis: "st", line: 10, at: -16, lane: 1, color: "#c0623a" },
  { axis: "st", line: 10, at: 1, lane: -1, color: "#356d8f" },
];

export function carTransform(c: CarSlot): {
  position: [number, number, number];
  rotation: number;
} {
  if (c.axis === "av") {
    return {
      position: [c.at, 0, c.line + c.lane * LANE],
      rotation: c.lane > 0 ? Math.PI / 2 : -Math.PI / 2,
    };
  }
  return {
    position: [c.line + c.lane * LANE, 0, c.at],
    rotation: c.lane > 0 ? 0 : Math.PI,
  };
}

/* --------------------------------------------------------- traffic lights -- */

/** Corners (x, z, y-rotation) where a GLB traffic light stands. */
export const TRAFFIC_LIGHTS: { x: number; z: number; rot: number }[] = [
  { x: -13.8, z: 0.2, rot: -Math.PI / 2 },
  { x: 11.8, z: 0.2, rot: Math.PI / 2 },
  { x: -13.8, z: -14.8, rot: -Math.PI / 2 },
  { x: 11.8, z: -14.8, rot: Math.PI / 2 },
];
