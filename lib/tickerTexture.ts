import * as THREE from "three";

/**
 * Builds a horizontally-repeating "LED ticker" texture: bright amber skill
 * words on a near-black field, used as the emissive map on a band wrapped
 * around the CN Tower (the Skills landmark). Scroll it by animating
 * `texture.offset.x`. Browser-only (uses a `<canvas>`) — call in a hook.
 */
export function createTickerTexture(text: string): THREE.CanvasTexture {
  const h = 128;
  const w = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#050608";
  ctx.fillRect(0, 0, w, h);

  ctx.font = "bold 64px Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffb454";

  // Tile the phrase across the full width so it reads continuously when wrapped.
  const phrase = `  ${text}  `;
  const phraseWidth = ctx.measureText(phrase).width;
  let x = 0;
  while (x < w) {
    ctx.fillText(phrase, x, h / 2 + 2);
    x += phraseWidth;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(2, 1);
  tex.anisotropy = 4;
  return tex;
}
