import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

/**
 * Low-poly CN Tower — the skyline centerpiece. Tapered hex shaft, the flared
 * SkyPod (main observation deck) with a lit glass-floor band, the upper SkyPod,
 * and a tall antenna spire with a blinking aviation light. Accent rings/bands
 * slowly cycle hue (the tower's signature colour-changing lights).
 *
 * Rendered as an ambient centerpiece; the Skills "LED ticker" zone wraps its
 * own band around the shaft separately. `glow` is kept for optional reuse.
 */
const accentProps = {
  color: "#0c0f1a",
  emissive: "#ff2d75",
  emissiveIntensity: 1.6,
  roughness: 0.5,
  flatShading: true,
} as const;

export default function CNTower({ glow = 0 }: { glow?: number }) {
  const ring1 = useRef<THREE.MeshStandardMaterial>(null);
  const ring2 = useRef<THREE.MeshStandardMaterial>(null);
  const deck = useRef<THREE.MeshStandardMaterial>(null);
  const pod = useRef<THREE.MeshStandardMaterial>(null);
  const tipRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const hue = (t * 0.06) % 1;
    const intensity = 1.5 + glow * 1.5 + Math.sin(t * 2) * 0.15;
    for (const ref of [ring1, ring2, deck, pod]) {
      const mat = ref.current;
      if (!mat) continue;
      mat.emissive.setHSL(hue, 0.85, 0.55);
      mat.emissiveIntensity = intensity;
    }
    if (tipRef.current) {
      tipRef.current.emissiveIntensity = 2 + (Math.sin(t * 4) * 0.5 + 0.5) * 3;
    }
  });

  const concrete = (
    <meshStandardMaterial color="#39414f" roughness={0.9} flatShading />
  );

  return (
    <group>
      {/* Podium */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.5, 3]} />
        {concrete}
      </mesh>

      {/* Tapered hex shaft */}
      <mesh position={[0, 6.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.72, 12, 6]} />
        {concrete}
      </mesh>

      {/* Base + mid accent rings (colour-cycling) */}
      <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.08, 8, 6]} />
        <meshStandardMaterial ref={ring1} {...accentProps} />
      </mesh>
      <mesh position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.06, 8, 6]} />
        <meshStandardMaterial ref={ring2} {...accentProps} />
      </mesh>

      {/* SkyPod — flared underside, lit deck band, body, upper cap */}
      <mesh position={[0, 9.7, 0]} castShadow>
        <cylinderGeometry args={[1.6, 0.4, 1.7, 12]} />
        {concrete}
      </mesh>
      <mesh position={[0, 10.45, 0]}>
        <cylinderGeometry args={[1.72, 1.72, 0.4, 12]} />
        <meshStandardMaterial ref={deck} {...accentProps} />
      </mesh>
      <mesh position={[0, 10.95, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.62, 0.65, 12]} />
        {concrete}
      </mesh>
      <mesh position={[0, 11.5, 0]} castShadow>
        <cylinderGeometry args={[1.15, 1.45, 0.45, 12]} />
        {concrete}
      </mesh>

      {/* Upper shaft + small SkyPod */}
      <mesh position={[0, 12.9, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.32, 2.3, 6]} />
        {concrete}
      </mesh>
      <mesh position={[0, 13.9, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 0.55, 8]} />
        <meshStandardMaterial ref={pod} {...accentProps} />
      </mesh>

      {/* Antenna spire */}
      <mesh position={[0, 16.3, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.16, 4, 6]} />
        <meshStandardMaterial color="#525b6e" roughness={0.7} flatShading />
      </mesh>

      {/* Blinking aviation tip */}
      <mesh position={[0, 18.4, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          ref={tipRef}
          color="#ff3030"
          emissive="#ff1a1a"
          emissiveIntensity={3}
        />
      </mesh>

      {/* Warm pool of light around the base */}
      <pointLight position={[0, 1.6, 2]} intensity={8} distance={12} color="#ff6fae" />
    </group>
  );
}
