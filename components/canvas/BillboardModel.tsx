import { useMemo } from "react";
import * as THREE from "three";

/**
 * The Skills landmark: a freestanding **billboard** whose screen shows a lit
 * "TORONTO" neon card — a dark panel with a bold wordmark, a red maple-leaf
 * accent, and a small tagline, applied as an emissive map so it reads as a
 * glowing sign at night. Built from primitives so it grounds cleanly and faces
 * forward (+Z by default; aim it with the parent `rotation`).
 *
 * `glow` (hover/active, supplied by the wrapping `Zone`) brightens the screen +
 * spill light. The `Zone` owns the pointer events and the hover lift, so this
 * component is purely visual.
 */
const SCREEN_W = 3.7;
const SCREEN_H = 1.6;
const SCREEN_Y = 2.1; // centre height of the screen

/** Draw a clean neon "SKILLS" card onto a canvas → emissive texture. */
function useCardTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const W = 1024;
    const H = 448;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;

    // Panel background (near-black, faint rounded card).
    ctx.fillStyle = "#06080e";
    ctx.fillRect(0, 0, W, H);
    const pad = 24;
    const r = 26;
    const x = pad,
      y = pad,
      w = W - pad * 2,
      h = H - pad * 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = "#0b1018";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffcf6b";
    ctx.stroke();

    ctx.textAlign = "center";

    // Maple-leaf accent above the wordmark.
    drawMapleLeaf(ctx, W / 2, y + 96, 52, "#ff3b4d");

    // "SKILLS" wordmark — warm neon.
    ctx.fillStyle = "#ffe9bf";
    ctx.font = "800 112px Arial, sans-serif";
    ctx.fillText("SKILLS", W / 2, y + 252);

    // Tagline.
    ctx.fillStyle = "#9fb3c8";
    ctx.font = "600 30px Arial, sans-serif";
    ctx.fillText("WHAT'S IN MY TOOLKIT", W / 2, y + 322);

    ctx.textAlign = "left";

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }, []);
}

/** A simple symmetric maple-leaf silhouette centred at (cx, cy). */
function drawMapleLeaf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  color: string,
) {
  // Normalised half-leaf outline (x right, y up), mirrored for the left half.
  const pts: [number, number][] = [
    [0, 1.0], [0.12, 0.6], [0.5, 0.7], [0.4, 0.45], [0.78, 0.5],
    [0.62, 0.28], [1.0, 0.18], [0.62, 0.0], [0.7, -0.2], [0.34, -0.16],
    [0.36, -0.5], [0.12, -0.3], [0.1, -0.62],
  ];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, -s); // flip y so positive is up
  ctx.beginPath();
  ctx.moveTo(0, 1.0);
  for (const [px, py] of pts) ctx.lineTo(px, py);
  for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(-pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.restore();
  ctx.fillStyle = color;
  ctx.fill();
}

export default function BillboardModel({
  position = [0, 0, 0],
  rotation = 0,
  scale = 1,
  glow = 0,
}: {
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
  glow?: number;
}) {
  const card = useCardTexture();
  const frameInset = 0.12;

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* Two support posts from the ground up to the screen. */}
      {[-SCREEN_W * 0.3, SCREEN_W * 0.3].map((x) => (
        <mesh key={x} position={[x, SCREEN_Y - SCREEN_H / 2 - 0.6, -0.06]} castShadow>
          <boxGeometry args={[0.16, SCREEN_Y - SCREEN_H / 2 + 0.6, 0.16]} />
          <meshStandardMaterial color="#1c2530" flatShading roughness={1} />
        </mesh>
      ))}
      {/* Frame behind the screen. */}
      <mesh position={[0, SCREEN_Y, -0.05]} castShadow>
        <boxGeometry args={[SCREEN_W + frameInset, SCREEN_H + frameInset, 0.12]} />
        <meshStandardMaterial color="#10161f" flatShading roughness={1} />
      </mesh>
      {/* The glowing card screen on the front face. */}
      <mesh position={[0, SCREEN_Y, 0.02]}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshStandardMaterial
          map={card}
          emissiveMap={card}
          emissive="#ffffff"
          emissiveIntensity={0.9 + glow * 0.9}
          toneMapped={false}
        />
      </mesh>
      {/* Soft spill light so the sign lights its surroundings. */}
      <pointLight position={[0, SCREEN_Y, 1.2]} intensity={3 + glow * 4} distance={7} color="#cfe0ff" />
    </group>
  );
}
