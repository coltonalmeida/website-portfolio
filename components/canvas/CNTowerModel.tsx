import { Component, Suspense, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Vector3Tuple } from "three";

/**
 * Swap-in seam for the real CN Tower GLB (the Sketchfab "CN Tower — Toronto,
 * Canada (game ready)" model). To use it:
 *   1. Download the model from Sketchfab as **glTF/GLB** (needs a Sketchfab
 *      account + accepting its licence).
 *   2. Save it to `public/models/cn-tower.glb`.
 *   3. Set `HAS_TOWER_MODEL = true` in `City.tsx`.
 *   4. Tune `scale` / `position` (in `City.tsx`) so it sits on the platform.
 *
 * While `enabled` is false — or if the file is missing / fails to load — it
 * renders `fallback` (the primitive `CNTower`) instead, so the scene never
 * breaks. No top-level `preload`, so nothing is fetched until it's enabled.
 */
const MODEL_URL = "/models/cn-tower.glb";

function Model({
  scale,
  position,
}: {
  scale: number;
  position: Vector3Tuple;
}) {
  const { scene } = useGLTF(MODEL_URL);

  // Hide the model's oversized circular base plaza — every tower mesh is < ~2
  // units across, while the base disc is ~13 wide, so a width threshold isolates
  // it cleanly. Leaves just the tower itself.
  useMemo(() => {
    scene.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      box.setFromObject(mesh);
      box.getSize(size);
      if (size.x > 6 || size.z > 6) mesh.visible = false;
    });
  }, [scene]);

  return <primitive object={scene} scale={scale} position={position} />;
}

class ModelBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function CNTowerModel({
  enabled,
  fallback,
  scale = 1,
  position = [0, 0, 0],
}: {
  enabled: boolean;
  fallback: ReactNode;
  scale?: number;
  position?: Vector3Tuple;
}) {
  if (!enabled) return <>{fallback}</>;
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Model scale={scale} position={position} />
      </Suspense>
    </ModelBoundary>
  );
}
