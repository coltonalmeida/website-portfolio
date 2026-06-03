"use client";

import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";

/**
 * Full-screen preloader, modelled 1:1 on the reference animation:
 *
 *  - a large centered, outline-only wordmark sits on a flat background;
 *  - a tiny percent counter rides along the wordmark's mid-line, travelling
 *    left -> right as it counts 0 -> 100;
 *  - at 100% the wordmark + counter fade and the overlay clears, revealing the
 *    3D scene underneath.
 *
 * It is driven by drei's `useProgress` (Three's default loading manager) but the
 * *displayed* value is smoothed on its own rAF loop so the count-up always reads
 * as a deliberate animation, even when assets load instantly or report progress
 * in jumps.
 */

const WORDMARK = "COLTON ALMEIDA";
// Minimum on-screen time (ms) so the count-up is always visible, even when the
// scene is already cached and `useProgress` reports done immediately.
const MIN_DURATION = 2600;

export default function Loader() {
  const { active, progress } = useProgress();

  // Latest loader state, read inside the animation loop without restarting it.
  const stateRef = useRef({ active, progress });
  stateRef.current = { active, progress };

  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    let shown = 0;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      const { active: isActive } = stateRef.current;

      // A time-based floor keeps the counter advancing smoothly regardless of
      // how the asset loader reports progress. While assets are still loading we
      // cap it at 90% so the counter visibly "waits"; once loading is done it
      // eases the rest of the way to 100.
      const floor = Math.min(100, (elapsed / MIN_DURATION) * 100);
      const target = isActive ? Math.min(floor, 90) : 100;
      shown += (target - shown) * 0.08;
      setDisplay(shown);

      if (!isActive && elapsed >= MIN_DURATION && shown >= 99.4) {
        setDisplay(100);
        setDone(true);
        return; // stop the loop; the overlay fades out from here
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pct = Math.min(100, Math.round(display));
  const counter = String(pct).padStart(3, "0");

  return (
    <div
      aria-hidden={done}
      className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0a0a0c] transition-opacity duration-700 ease-out ${
        done ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Wordmark + travelling counter. The counter is positioned relative to
          this wrapper so `left: pct%` maps cleanly across the wordmark width. */}
      <div className="loader-fade relative">
        <h1
          className="select-none whitespace-nowrap font-extrabold uppercase leading-none tracking-tight text-transparent"
          style={{
            fontSize: "clamp(1.75rem, 8.5vw, 7rem)",
            WebkitTextStroke: "1.5px rgba(245, 245, 247, 0.6)",
          }}
        >
          {WORDMARK}
        </h1>

        <span
          className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] tracking-[0.25em] text-white/70 tabular-nums"
          style={{ left: `${pct}%` }}
        >
          {counter}
        </span>
      </div>

      <style jsx>{`
        @keyframes loaderFadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .loader-fade {
          animation: loaderFadeIn 0.7s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .loader-fade {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
