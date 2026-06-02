"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import CameraRig, { HOME } from "./CameraRig";
import { usePortfolio } from "@/lib/store";

/**
 * The `<Canvas>` wrapper: sets DPR, shadows, and the default camera framing,
 * then renders the world (`<Scene>`). `CameraRig` owns the controls and flies
 * the camera to the active section (or back home on deselect).
 */
export default function Experience() {
  const setActiveSection = usePortfolio((s) => s.setActiveSection);

  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      camera={{ position: HOME.position, fov: 45, near: 0.1, far: 200 }}
      className="h-full w-full"
      onPointerMissed={() => setActiveSection(null)}
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <CameraRig />
    </Canvas>
  );
}
