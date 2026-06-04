"use client";

import { useEffect, useState } from "react";
import { usePortfolio } from "@/lib/store";
import MistBackground from "./MistBackground";

/**
 * Intro transition that sits between the preloader and the live city. It holds
 * a sheet of animated fog over the scene, then — once the loader hands off
 * (`loaded`) — fades and scales the fog away over ~2s. Paired with the camera's
 * INTRO -> HOME glide (see `CameraRig`), it reads as flying through the mist
 * down into Toronto. The whole layer unmounts when the clear finishes so the
 * shader's render loop stops costing GPU during normal use.
 */
const HOLD_MS = 400; // let the loader finish fading before the fog starts clearing
const CLEAR_MS = 2000; // duration of the fade + zoom-out

export default function FogIntro() {
  const loaded = usePortfolio((s) => s.loaded);
  const [clearing, setClearing] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    const hold = setTimeout(() => setClearing(true), HOLD_MS);
    const finish = setTimeout(() => setGone(true), HOLD_MS + CLEAR_MS + 100);
    return () => {
      clearTimeout(hold);
      clearTimeout(finish);
    };
  }, [loaded]);

  if (gone) return null;

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-0 z-40 overflow-hidden transition-all ease-out ${
        clearing ? "opacity-0 motion-safe:scale-125" : "opacity-100 scale-100"
      }`}
      style={{ transitionDuration: `${CLEAR_MS}ms` }}
    >
      <MistBackground
        className="absolute inset-0 h-full w-full"
        style={{ background: "#070b18" }}
      />
    </div>
  );
}
