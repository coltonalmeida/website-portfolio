import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Low-poly CN Tower: tapered hex shaft, the flared SkyPod (observation deck),
 * upper pod, and the antenna spire with a blinking aviation light. The deck
 * band + accent rings slowly cycle hue (the tower's signature colour-changing
 * lights); `glow` (hover/active) boosts their emissive intensity.
 *
 * One shared accent material instance is animated once per frame.
 */
export default function CNTower({ glow = 0 }: { glow?: number }) {
  const accent = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0c0f1a",
        emissive: "#ff2d75",
        emissiveIntensity: 1.6,
        roughness: 0.5,
        flatShading: true,
      }),
    [],
  );
  const tipRef = useRef<THREE.MeshStandardMaterial>(null);
  useEffect(() => () => accent.dispose(), [accent]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    accent.emissive.setHSL((t * 0.06) % 1, 0.85, 0.55);
    accent.emissiveIntensity = 1.5 + glow * 1.8 + Math.sin(t * 2) * 0.15;
    if (tipRef.current) {
      tipRef.current.emissiveIntensity = 2 + (Math.sin(t * 4) * 0.5 + 0.5) * 3;
    }
  });

  const concrete = (
    <meshStandardMaterial color="#2b313f" roughness={0.9} flatShading />
  );

  return (
    <group>
      {/* Podium */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.4, 2.2]} />
        {concrete}
      </mesh>

      {/* Tapered hex shaft */}
      <mesh position={[0, 4.15, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.55, 7.5, 6]} />
        {concrete}
      </mesh>

      {/* Base + mid accent rings (colour-cycling) */}
      <mesh position={[0, 0.6, 0]} material={accent} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.06, 8, 6]} />
      </mesh>
      <mesh position={[0, 4.2, 0]} material={accent} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.4, 0.05, 8, 6]} />
      </mesh>

      {/* SkyPod — flared underside, deck, lit band, upper cap */}
      <mesh position={[0, 6.95, 0]} castShadow>
        <cylinderGeometry args={[1.1, 0.28, 1.1, 12]} />
        {concrete}
      </mesh>
      <mesh position={[0, 7.55, 0]} material={accent}>
        <cylinderGeometry args={[1.2, 1.2, 0.3, 12]} />
      </mesh>
      <mesh position={[0, 7.85, 0]} castShadow>
        <cylinderGeometry args={[1.08, 1.12, 0.45, 12]} />
        {concrete}
      </mesh>
      <mesh position={[0, 8.2, 0]} castShadow>
        <cylinderGeometry args={[0.85, 1.0, 0.3, 12]} />
        {concrete}
      </mesh>

      {/* Upper shaft + small SkyPod */}
      <mesh position={[0, 9.0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 1.6, 6]} />
        {concrete}
      </mesh>
      <mesh position={[0, 9.55, 0]} material={accent}>
        <cylinderGeometry args={[0.36, 0.42, 0.4, 8]} />
      </mesh>

      {/* Antenna spire */}
      <mesh position={[0, 11.1, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.11, 2.7, 6]} />
        <meshStandardMaterial color="#454d5e" roughness={0.7} flatShading />
      </mesh>

      {/* Blinking aviation tip */}
      <mesh position={[0, 12.5, 0]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial
          ref={tipRef}
          color="#ff3030"
          emissive="#ff1a1a"
          emissiveIntensity={3}
        />
      </mesh>

      {/* Warm pool of light cast on the ground around the base */}
      <pointLight
        position={[0, 1.2, 1.4]}
        intensity={6}
        distance={9}
        color="#ff6fae"
      />
    </group>
  );
}
