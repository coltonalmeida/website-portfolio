import { CameraControls } from "@react-three/drei";
import { useEffect, useRef, type ComponentRef } from "react";
import type { Vector3Tuple } from "three";
import { usePortfolio } from "@/lib/store";
import { ZONES } from "@/lib/zones";

/**
 * Drives the camera from the active section. Uses drei `CameraControls`
 * (`makeDefault`) for smooth `setLookAt` transitions.
 *
 * - On first mount it plays an **intro**: snap high above the lake, then glide
 *   down into the HOME framing.
 * - An effect watches `activeSection`: focus a zone → fly to its `cameraTarget`;
 *   deselect → fly back to HOME. While focused, user orbiting is locked.
 */

/**
 * Default "home" framing — a 3/4 view from over Lake Ontario (south), looking
 * north into the lit skyline with the CN Tower anchoring the scene.
 */
export const HOME: { position: Vector3Tuple; lookAt: Vector3Tuple } = {
  position: [14, 12, 27],
  lookAt: [0, 5, -4],
};

/** High, pulled-back opening pose the camera glides in from on first load. */
const INTRO: { position: Vector3Tuple; lookAt: Vector3Tuple } = {
  position: [4, 40, 64],
  lookAt: [0, 6, -4],
};

export default function CameraRig() {
  const controlsRef = useRef<ComponentRef<typeof CameraControls>>(null);
  const activeSection = usePortfolio((s) => s.activeSection);
  const firstRun = useRef(true);

  // Intro fly-in (runs once).
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.smoothTime = 1.2;
    void controls.setLookAt(...INTRO.position, ...INTRO.lookAt, false);
    const raf = requestAnimationFrame(() => {
      void controls.setLookAt(...HOME.position, ...HOME.lookAt, true);
    });
    const restore = setTimeout(() => {
      controls.smoothTime = 0.5;
    }, 1800);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(restore);
    };
  }, []);

  // Fly to the active zone / back home. Skip the first run so it doesn't
  // stomp the intro's initial framing.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const zone = activeSection
      ? ZONES.find((z) => z.id === activeSection)
      : null;
    const { position, lookAt } = zone ? zone.cameraTarget : HOME;

    void controls.setLookAt(...position, ...lookAt, true);
  }, [activeSection]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      enabled={activeSection === null}
      smoothTime={0.5}
      minDistance={6}
      maxDistance={60}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2 - 0.05}
    />
  );
}
