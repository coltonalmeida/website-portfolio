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

const WARM = ["#ffd27a", "#ffbb55", "#ffe6ad", "#ffcf8a"];
const COOL = ["#bfe0ff", "#9fd4ff"];

export interface WindowTextureOptions {
  cols: number;
  rows: number;
  seed: number;
  /** Fraction of windows that are lit. */
  litChance?: number;
  /** Fraction of lit windows that glow cool/white instead of warm. */
  coolChance?: number;
}

export function createWindowTexture({
  cols,
  rows,
  seed,
  litChance = 0.6,
  coolChance = 0.15,
}: WindowTextureOptions): THREE.CanvasTexture {
  const cell = 16;
  const gap = 6;
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
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = rng() < litChance;
      if (lit) {
        const cool = rng() < coolChance;
        const palette = cool ? COOL : WARM;
        ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
      } else {
        ctx.fillStyle = "#070a12"; // near-black "off" window
      }
      ctx.fillRect(c * cell + gap / 2, r * cell + gap / 2, cell - gap, cell - gap);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = 4;
  return tex;
}
