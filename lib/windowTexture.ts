import * as THREE from "three";

/**
 * Procedural "lit windows" textures for the night skyline. Each texture is a
 * grid of windows on a black field — most lit (warm amber / a few cool white),
 * some dark — so towers read as occupied at night. Used as an `emissiveMap`
 * only (black = no glow), so the building's flat dark facade shows through and
 * the windows self-illuminate (and bloom).
 *
 * Deterministic per `seed` (seeded RNG) so reloads and screenshots are stable.
 * Browser-only (uses a `<canvas>`); call inside a `useMemo`, not at module load.
 */

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WARM: [number, number, number][] = [
  [255, 210, 122],
  [255, 187, 85],
  [255, 230, 173],
  [255, 207, 138],
];
const COOL: [number, number, number][] = [
  [191, 224, 255],
  [159, 212, 255],
  [205, 232, 255],
];

export interface WindowTextureOptions {
  cols: number;
  rows: number;
  seed: number;
  /** Fraction of windows that are lit. */
  litChance?: number;
  /** Fraction of lit windows that glow cool/white instead of warm. */
  coolChance?: number;
}

/**
 * Build the emissive window grid. The key realism moves vs. a flat grid:
 *  - **Per-building temperature**: a building is mostly warm OR mostly cool
 *    (disciplined clusters), not randomly-scattered cyan noise.
 *  - **Clustered darkness**: whole floors and the odd vertical service column
 *    go dark, on top of per-window off — so it reads as an occupied building,
 *    not a uniform texture. Lit ratio lands lower than the nominal `litChance`.
 *  - **Brightness variation**: each lit window is dimmed by a random factor, so
 *    some rooms are bright and some barely glow.
 *  - **Recessed bezel**: a dark frame around a slightly-inset bright core gives
 *    cheap window depth at distance.
 */
export function createWindowTexture({
  cols,
  rows,
  seed,
  litChance = 0.48,
  coolChance,
}: WindowTextureOptions): THREE.CanvasTexture {
  const cell = 20;
  const gap = 6;
  const inset = 2; // bezel thickness inside the cell's lit area
  const w = cols * cell;
  const h = rows * cell;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Black field = no emission anywhere except the lit windows.
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);

  const rng = mulberry32(seed);

  // Building-wide temperature: most towers are warm; a minority skew cool. The
  // chosen building leans hard one way so colour reads as "interior lighting".
  const buildingCool = rng() < 0.3;
  const coolP = coolChance ?? (buildingCool ? 0.72 : 0.05);

  // Pre-roll which floors / columns are dark (clustered, not per-window).
  const darkRow: boolean[] = [];
  for (let r = 0; r < rows; r++) darkRow[r] = rng() < 0.16;
  const darkCol: boolean[] = [];
  for (let c = 0; c < cols; c++) darkCol[c] = rng() < 0.1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit =
        !darkRow[r] && !darkCol[c] && rng() < litChance;
      const x = c * cell + gap / 2;
      const y = r * cell + gap / 2;
      const cw = cell - gap;
      const ch = cell - gap;

      if (lit) {
        const cool = rng() < coolP;
        const palette = cool ? COOL : WARM;
        const [pr, pg, pb] = palette[Math.floor(rng() * palette.length)];
        // Per-window brightness: a few bright, most mid, some dim.
        const b = 0.4 + rng() * 0.6;
        // Dark bezel frame (no glow), then the brighter inset core.
        ctx.fillStyle = "#05070d";
        ctx.fillRect(x, y, cw, ch);
        ctx.fillStyle = `rgb(${Math.round(pr * b)},${Math.round(pg * b)},${Math.round(pb * b)})`;
        ctx.fillRect(x + inset, y + inset, cw - inset * 2, ch - inset * 2);
      } else {
        ctx.fillStyle = "#06080f"; // near-black "off" window
        ctx.fillRect(x, y, cw, ch);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  // Linear filtering + mipmaps + high anisotropy kills the shimmer/aliasing the
  // old NearestFilter grid had at distance.
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 16;
  return tex;
}
