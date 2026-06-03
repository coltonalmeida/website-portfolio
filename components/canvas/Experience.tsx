"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette, SMAA, N8AO } from "@react-three/postprocessing";
import Scene from "./Scene";
import CameraRig, { HOME } from "./CameraRig";
import { usePortfolio } from "@/lib/store";

/**
 * The `<Canvas>` wrapper: sets DPR, shadows, and the default camera framing,
 * then renders the world (`<Scene>`). `CameraRig` owns the controls and flies
 * the camera to the active section (or back home on deselect).
 *
 * If WebGL isn't available, a graceful DOM fallback renders instead — the menu
 * (rendered alongside this in `page.tsx`) still opens every section's content.
 */
export default function Experience() {
  const setActiveSection = usePortfolio((s) => s.setActiveSection);
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let ok = false;
    try {
      const canvas = document.createElement("canvas");
      ok = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      ok = false;
    }
    const raf = requestAnimationFrame(() => setSupported(ok));
    return () => cancelAnimationFrame(raf);
  }, []);

  if (supported === false) return <NoWebGLFallback />;
  // Pre-check (null): show the night backdrop so nothing flashes white.
  if (supported === null) return <div className="h-full w-full bg-[#070b18]" />;

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

      {/* Night glow: a tamed bloom so the city glows cohesively instead of
          clipping to white, SMAA to kill the window aliasing, soft vignette. */}
      <EffectComposer enableNormalPass={false} multisampling={0}>
        {/* Subtle AO so the low-poly cylinders/tapers read with contact shading
            (half-res for perf; gentle so the night scene doesn't go muddy). */}
        <N8AO halfRes aoRadius={3} distanceFalloff={1} intensity={1.6} />
        <Bloom
          intensity={0.62}
          luminanceThreshold={0.26}
          luminanceSmoothing={0.85}
          mipmapBlur
          radius={0.55}
        />
        <Vignette eskil={false} offset={0.22} darkness={0.72} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}

/** Shown when the browser can't create a WebGL context. */
function NoWebGLFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#070b18] p-8">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-400">
          Toronto at night
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          3D view unavailable
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Your browser couldn&apos;t start WebGL, so the interactive city
          can&apos;t render. You can still browse every section using the menu
          at the top of the page.
        </p>
      </div>
    </div>
  );
}
