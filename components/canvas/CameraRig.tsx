import { CameraControls } from "@react-three/drei";
import { useEffect, useRef, type ComponentRef } from "react";
import type { Vector3Tuple } from "three";
import { usePortfolio } from "@/lib/store";
import { ZONES } from "@/lib/zones";

/**
 * Drives the camera from the active section. Uses drei `CameraControls`
 * (`makeDefault`) for smooth `setLookAt` transitions. An effect watches
 * `activeSection`: focus a zone → fly to its `cameraTarget`; deselect → fly
 * back to HOME. While a section is focused, user orbiting is locked
 * (`enabled={false}`) so the framing stays put until the visitor closes it.
 */

/**
 * Default "home" framing — a 3/4 view from over Lake Ontario (south), looking
 * north into the lit skyline with the CN Tower anchoring the scene.
 */
export const HOME: { position: Vector3Tuple; lookAt: Vector3Tuple } = {
  position: [9, 8, 17],
  lookAt: [-1, 3.5, -3],
};

export default function CameraRig() {
  const controlsRef = useRef<ComponentRef<typeof CameraControls>>(null);
  const activeSection = usePortfolio((s) => s.activeSection);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const zone = activeSection
      ? ZONES.find((z) => z.id === activeSection)
      : null;
    const { position, lookAt } = zone ? zone.cameraTarget : HOME;

    void controls.setLookAt(
      position[0],
      position[1],
      position[2],
      lookAt[0],
      lookAt[1],
      lookAt[2],
      true, // animate the transition
    );
  }, [activeSection]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      enabled={activeSection === null}
      smoothTime={0.5}
      minDistance={6}
      maxDistance={34}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2 - 0.05}
    />
  );
}
