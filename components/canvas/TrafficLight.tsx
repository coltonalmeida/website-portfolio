import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

/**
 * A single traffic light isolated from the Sketchfab "low-poly road & traffic
 * pack" GLB (which is a whole row of street furniture). We clone the scene and
 * keep only the meshes of the first light — the one standing at x ≈ 0 — then
 * light its green "go" lens so it glows at night. Cloned per instance so several
 * can stand at different corners.
 */
const URL = "/models/road-traffic-pack.glb";

export default function TrafficLight({
  position,
  rotation = 0,
  scale = 0.34,
}: {
  position: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  const { scene } = useGLTF(URL);

  const obj = useMemo(() => {
    const clone = scene.clone(true);
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3();
    const center = new THREE.Vector3();
    const drop: THREE.Object3D[] = [];

    clone.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      box.setFromObject(mesh);
      box.getCenter(center);
      if (Math.abs(center.x) > 0.6) {
        drop.push(mesh); // keep only the first light (x ≈ 0)
        return;
      }
      // Make the green lens glow so the light reads as "on".
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (/Ye/.test(mesh.name) && mat?.isMeshStandardMaterial) {
        const lit = mat.clone();
        lit.emissive = new THREE.Color("#39d353");
        lit.emissiveIntensity = 2.5;
        mesh.material = lit;
      }
    });
    drop.forEach((m) => m.parent?.remove(m));
    return clone;
  }, [scene]);

  return (
    <primitive
      object={obj}
      position={position}
      rotation={[0, rotation, 0]}
      scale={scale}
    />
  );
}

useGLTF.preload(URL);
