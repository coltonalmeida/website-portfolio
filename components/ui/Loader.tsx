"use client";

import { useProgress } from "@react-three/drei";

/**
 * Full-screen preloader driven by drei's `useProgress` (backed by Three's
 * default loading manager). It shows while assets are loading and fades out
 * when done. With the current primitive island there's little to load, but
 * this is wired up for the GLB/texture swap-in later.
 */
export default function Loader() {
  const { active, progress } = useProgress();

  return (
    <div
      aria-hidden={!active}
      className={`pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0b1220] transition-opacity duration-500 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      <p className="text-sm tracking-wide text-white/70">
        Loading island… {Math.round(progress)}%
      </p>
    </div>
  );
}
