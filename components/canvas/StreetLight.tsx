import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

/**
 * A single GLB street lamp, isolated from the Sketchfab "Simple collection of
 * low-poly street lights v3" pack (CC-BY) — a row of ~22 lamp variants. We keep
 * only the chosen `variant` node (each is a `Farola…` node with a `_black_0`
 * body + a `_white_emiting_0` head), recentre it over its post, drop its base to
 * the ground, and auto-scale every variant to a consistent height so a mix reads
 * evenly. The emissive head glows warm at night; some lamps also cast a real
 * point light (`cast`) — kept to a subset so the scene isn't flooded with lights.
 */
const URL = "/models/street-lights.glb";
const TARGET_H = 2.2; // world height every variant is scaled to

export default function StreetLight({
  position,
  rotation = 0,
  variant,
  cast = false,
}: {
  position: [number, number, number];
  rotation?: number;
  variant: string;
  cast?: boolean;
}) {
  const { scene } = useGLTF(URL);

  const { obj, scale, headY } = useMemo(() => {
    const clone = scene.clone(true);

    // Keep only the chosen lamp's subtree (preserving ancestor transforms so it
    // stays upright); remove every other lamp in the collection. Never fall back
    // to the whole pack — render nothing if the variant name isn't found (GLTF
    // node names are sanitized, so only spaceless/dotless names resolve).
    const lamp = clone.getObjectByName(variant);
    if (!lamp) return { obj: new THREE.Group(), scale: 1, headY: 0 };
    const keep = new Set<THREE.Object3D>();
    lamp.traverse((o) => keep.add(o));
    const remove: THREE.Object3D[] = [];
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !keep.has(o)) remove.push(o);
    });
    remove.forEach((m) => m.parent?.remove(m));

    // Recentre over the post + drop to the ground.
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(lamp);
    const center = new THREE.Vector3();
    box.getCenter(center);
    clone.position.add(new THREE.Vector3(-center.x, -box.min.y, -center.z));

    const h = box.max.y - box.min.y || 1;
    const s = TARGET_H / h;

    // Make the emissive "head" material glow warm; clone it so per-instance.
    lamp.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const src = mesh.material as THREE.MeshStandardMaterial;
      if (!src?.isMeshStandardMaterial) return;
      const m = src.clone();
      mesh.material = m;
      if (src.name === "white_emiting") {
        m.color.set("#fff3d4");
        m.emissive = new THREE.Color("#ffdf9a");
        m.emissiveIntensity = 2.2;
        m.toneMapped = false;
      } else {
        m.color.set("#222831");
        m.roughness = 1;
        m.metalness = 0.2;
      }
    });

    // Head height in pre-scale local space (point light sits there).
    return { obj: clone, scale: s, headY: h * 0.94 };
  }, [scene, variant]);

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <primitive object={obj} />
      {cast && (
        <pointLight position={[0, headY, 0]} intensity={3.2} distance={7} color="#ffd98a" />
      )}
    </group>
  );
}

useGLTF.preload(URL);
