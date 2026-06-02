"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import Scene from "./Scene";
import { usePortfolio } from "@/lib/store";

/**
 * The `<Canvas>` wrapper: sets DPR, shadows, and the default camera framing,
 * then renders the world (`<Scene>`). `OrbitControls` lets visitors orbit the
 * island for now; Step 4 swaps in a `CameraRig` driven by the active section.
 */
export default function Experience() {
  const setActiveSection = usePortfolio((s) => s.setActiveSection);

  return (
    <Canvas
      dpr={[1, 2]}
      shadows
      camera={{ position: [13, 9, 13], fov: 45, near: 0.1, far: 200 }}
      className="h-full w-full"
      onPointerMissed={() => setActiveSection(null)}
    >
      <Scene />

      <OrbitControls
        makeDefault
        enableDamping
        enablePan={false}
        target={[0, 1.4, 0]}
        minDistance={8}
        maxDistance={32}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  );
}
