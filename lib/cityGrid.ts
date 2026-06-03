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

/**
 * A road segment. `axis: "x"` runs E–W at z=`along`; `"z"` runs N–S at x=`along`.
 * Every street is treated as **one-way**: `oneway` is the travel direction along
 * the road's axis (+1 = toward +x / +z, -1 = toward -x / -z). This drives which
 * way the traffic signals face at each intersection.
 */
export interface RoadSeg {
  axis: "x" | "z";
  along: number;
  from: number;
  to: number;
  width: number;
  oneway: 1 | -1;
}

export const MAIN_AVENUE_Z = 2;

/**
 * Irregular arterial network — uneven spacing, routed to leave the landmark
 * plaza (centre) clear. Two E–W avenues + a back street, two N–S cross streets.
 * Directions alternate so the one-way grid reads like a real downtown.
 */
export const ROADS: RoadSeg[] = [
  { axis: "x", along: MAIN_AVENUE_Z, from: -26, to: 26, width: 3.0, oneway: 1 }, // waterfront ave — eastbound
  { axis: "x", along: -13, from: -24, to: 24, width: 2.6, oneway: -1 }, // midtown ave — westbound
  { axis: "x", along: -22, from: -22, to: 22, width: 2.2, oneway: 1 }, // uptown back st — eastbound
  { axis: "z", along: -12, from: -24, to: 7, width: 2.6, oneway: 1 }, // west cross st — southbound
  { axis: "z", along: 10, from: -24, to: 7, width: 2.6, oneway: -1 }, // east cross st — northbound
];

/**
 * Zebra crosswalks at each avenue × cross-street intersection. For every
 * intersection we lay all FOUR legs — a crossing set back on each approach
 * (west + east across the avenue, north + south across the street) — so the
 * intersection reads as a complete crossing on every side.
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
      const stBack = st.width / 2 + 0.7; // set-back across the avenue
      const avBack = av.width / 2 + 0.7; // set-back across the street
      // Across the avenue — west + east legs.
      out.push({ x: ix - stBack, z: iz, axis: "x", width: av.width });
      out.push({ x: ix + stBack, z: iz, axis: "x", width: av.width });
      // Across the street — north + south legs.
      out.push({ x: ix, z: iz - avBack, axis: "z", width: st.width });
      out.push({ x: ix, z: iz + avBack, axis: "z", width: st.width });
    }
  }
  return out;
})();

/** Every avenue × cross-street intersection centre (for signals + lamp spacing). */
export const INTERSECTIONS: { x: number; z: number }[] = (() => {
  const out: { x: number; z: number }[] = [];
  const avenues = ROADS.filter((r) => r.axis === "x");
  const streets = ROADS.filter((r) => r.axis === "z");
  for (const av of avenues) {
    for (const st of streets) {
      const ix = st.along;
      const iz = av.along;
      if (ix > av.from && ix < av.to && iz > st.from && iz < st.to)
        out.push({ x: ix, z: iz });
    }
  }
  return out;
})();

/** True if (x, z) is within `pad` of any intersection centre. */
export function isNearIntersection(x: number, z: number, pad: number): boolean {
  return INTERSECTIONS.some((p) => Math.hypot(x - p.x, z - p.z) < pad);
}

/* --------------------------------------------------- one-way signals -- */

/**
 * An overhead mast-arm traffic signal placement. One per crossing road at each
 * intersection: the arm spans that road and the heads face its one-way oncoming
 * traffic. `phase` alternates avenue (0) vs cross-street (1) so perpendicular
 * directions are out of sync. Limited to the two front avenues (the uptown back
 * street is left unsignalised) to keep the heavy GLB count down.
 */
export interface SignalSpec {
  x: number;
  z: number;
  rot: number; // Y rotation
  phase: 0 | 1;
}
export const SIGNALS: SignalSpec[] = (() => {
  const out: SignalSpec[] = [];
  const avenues = ROADS.filter((r) => r.axis === "x");
  const streets = ROADS.filter((r) => r.axis === "z");
  const FAR = 0.7; // offset past the intersection to the far side
  const CURB = 0.3; // offset out to the curb the pole stands on
  for (const av of avenues) {
    if (av.along < -16) continue; // skip the uptown back street
    for (const st of streets) {
      const ix = st.along;
      const iz = av.along;
      if (!(ix > av.from && ix < av.to && iz > st.from && iz < st.to)) continue;
      const avHalf = av.width / 2;
      const stHalf = st.width / 2;
      // Avenue signal (controls E–W traffic), phase 0. Default mast: arm +x,
      // heads -z. Rotate ±90° so the arm spans the avenue (along z).
      if (av.oneway === 1) {
        out.push({ x: ix + stHalf + FAR, z: iz + avHalf + CURB, rot: Math.PI / 2, phase: 0 });
      } else {
        out.push({ x: ix - stHalf - FAR, z: iz - avHalf - CURB, rot: -Math.PI / 2, phase: 0 });
      }
      // Cross-street signal (controls N–S traffic), phase 1. Arm already spans x.
      if (st.oneway === 1) {
        out.push({ x: ix - stHalf - CURB, z: iz + avHalf + FAR, rot: 0, phase: 1 });
      } else {
        out.push({ x: ix + stHalf + CURB, z: iz - avHalf - FAR, rot: Math.PI, phase: 1 });
      }
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
  // Deep-north skyline backdrop — a tall row across the back of the map so the
  // horizon behind the CN Tower reads as a real downtown silhouette.
  { cx: 0, cz: -23.5, cols: 7, rows: 1, dx: 3.3, dz: 2.8, hMin: 6, hMax: 13 },
  { cx: -20, cz: -22.5, cols: 2, rows: 2, dx: 3.0, dz: 2.8, hMin: 4, hMax: 8 },
  { cx: 20, cz: -22.5, cols: 2, rows: 2, dx: 3.0, dz: 2.8, hMin: 4, hMax: 8 },
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
  { cx: -15, cz: -9, cols: 2, rows: 2, dx: 2.6, dz: 2.8, hMin: 3, hMax: 7 },
  { cx: 14, cz: -6, cols: 2, rows: 2, dx: 2.6, dz: 2.8, hMin: 3, hMax: 7 },
  // Waterfront low-rise (south of the main avenue).
  { cx: -18, cz: 5.2, cols: 3, rows: 1, dx: 3.0, dz: 3.0, hMin: 2, hMax: 3 },
  { cx: 16, cz: 5.2, cols: 3, rows: 1, dx: 3.0, dz: 3.0, hMin: 2, hMax: 3 },
  { cx: -8, cz: 5.4, cols: 2, rows: 1, dx: 3.0, dz: 3.0, hMin: 2, hMax: 3 },
  { cx: 8, cz: 5.4, cols: 2, rows: 1, dx: 3.0, dz: 3.0, hMin: 2, hMax: 3 },
];

/**
 * Landmark footprints kept clear of ambient buildings (x, z, radius). These
 * mirror the zone positions in `lib/zones.ts` — the three big landmark buildings
 * are spread far apart (Union west, tower centre, Construction east).
 */
const RESERVED: { x: number; z: number; r: number }[] = [
  { x: 0, z: -5, r: 6 }, // CN Tower (centre, ambient)
  { x: -1, z: -0.3, r: 4.2 }, // "TORONTO" sign plaza / Skills (south of tower)
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
