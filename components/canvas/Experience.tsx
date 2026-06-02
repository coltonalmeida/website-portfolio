"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import type { Mesh } from "three";

/**
 * Step 1 baseline: confirm WebGL + R3F render with a single rotating mesh
 * and orbit controls. This component is the `<Canvas>` wrapper that later
 * steps fill out with the island, zones, environment, and camera rig.
 */
function SpinningBox() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.4;
    meshRef.current.rotation.y += delta * 0.6;
  });

  return (
    <mesh ref={meshRef} castShadow>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial color="#4f9dde" flatShading />
    </mesh>
  );
}

export default function Experience() {
  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      camera={{ position: [4, 3, 5], fov: 50 }}
      className="h-full w-full"
    >
      <color attach="background" args={["#0b1220"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <SpinningBox />
      <OrbitControls enableDamping makeDefault />
    </Canvas>
  );
}
