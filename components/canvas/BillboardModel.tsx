import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * A freestanding billboard whose screen shows a lit **"TORONTO" neon sign** — a
 * dark panel with a bold wordmark, a red maple-leaf accent, and a small tagline
 * — applied as an emissive map so it reads as a glowing sign at night. (Replaces
 * the old placeholder lorem-ipsum card.) Built from primitives so it grounds
 * cleanly and faces forward (aim it with the parent `rotation`).
 */
const SCREEN_W = 3.4;
const SCREEN_H = 2.0;
const SCREEN_Y = 2.6; // centre height of the screen

/** Draw a clean Toronto neon sign onto a canvas → emissive texture. */
function useCardTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const W = 768;
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

    // "TORONTO" wordmark — warm neon.
    ctx.fillStyle = "#ffe9bf";
    ctx.font = "800 96px Arial, sans-serif";
    ctx.fillText("TORONTO", W / 2, y + 250);

    // Tagline.
    ctx.fillStyle = "#9fb3c8";
    ctx.font = "600 30px Arial, sans-serif";
    ctx.fillText("THE SIX · ONTARIO, CANADA", W / 2, y + 320);

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
  position,
  rotation = 0,
  scale = 1,
}: {
  position: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  const card = useCardTexture();
  const frameInset = 0.12;

  // Same "pop + glow" interaction the landmark zones use: on hover the whole
  // sign lifts + scales a touch and the screen/spill light brighten. Animated
  // by ref in useFrame (never via React props), matching `Zone`.
  const inner = useRef<THREE.Group>(null);
  const screen = useRef<THREE.MeshStandardMaterial>(null);
  const spill = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    const g = inner.current;
    if (g) {
      g.position.y = THREE.MathUtils.damp(g.position.y, hovered ? 0.25 : 0, 9, delta);
      const s = THREE.MathUtils.damp(g.scale.x, hovered ? 1.06 : 1, 9, delta);
      g.scale.setScalar(s);
    }
    if (screen.current) {
      screen.current.emissiveIntensity = THREE.MathUtils.damp(
        screen.current.emissiveIntensity,
        hovered ? 1.8 : 0.9,
        8,
        delta,
      );
    }
    if (spill.current) {
      spill.current.intensity = THREE.MathUtils.damp(
        spill.current.intensity,
        hovered ? 7 : 3,
        8,
        delta,
      );
    }
  });

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      <group ref={inner}>
        {/* Two support posts from the ground up to the screen. */}
        {[-SCREEN_W * 0.3, SCREEN_W * 0.3].map((x) => (
          <mesh key={x} position={[x, SCREEN_Y - SCREEN_H / 2 - 0.6, -0.06]} castShadow>
            <boxGeometry args={[0.16, (SCREEN_Y - SCREEN_H / 2) + 0.6, 0.16]} />
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
            ref={screen}
            map={card}
            emissiveMap={card}
            emissive="#ffffff"
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>
        {/* Soft spill light so the sign lights its surroundings. */}
        <pointLight ref={spill} position={[0, SCREEN_Y, 1.2]} intensity={3} distance={7} color="#cfe0ff" />
      </group>
    </group>
  );
}
