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

  // Classify the tower's meshes by geometry and give each part a distinct,
  // night-appropriate material (instead of the old uniform flat-blue darkening):
  //  - the oversized circular base plaza is hidden (width threshold),
  //  - the thin mast above the pod becomes a dark metallic grey,
  //  - the shaft + SkyPod become a warm light-grey concrete with a faint warm
  //    self-glow so the landmark reads at night without fighting the warm city.
  // We also measure the pod height/radius + the tip so the accent ring, pod
  // glow and red aviation beacon can be placed in model-local space below.
  const info = useMemo(() => {
    scene.updateMatrixWorld(true);
    const overall = new THREE.Box3();
    const parts: {
      mesh: THREE.Mesh;
      center: THREE.Vector3;
      size: THREE.Vector3;
      box: THREE.Box3;
    }[] = [];

    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const box = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      if (size.x > 6 || size.z > 6) {
        mesh.visible = false; // base plaza disc
        return;
      }
      parts.push({ mesh, center, size, box });
      overall.union(box);
    });

    const minY = overall.min.y;
    const maxY = overall.max.y;
    const H = maxY - minY || 1;
    const axis = new THREE.Vector3();
    overall.getCenter(axis);

    // The SkyPod = the widest mesh in the upper half of the tower.
    let pod = parts[0];
    for (const p of parts) {
      const frac = (p.center.y - minY) / H;
      const ext = Math.max(p.size.x, p.size.z);
      if (frac > 0.45 && (!pod || ext > Math.max(pod.size.x, pod.size.z))) pod = p;
    }
    const podY = pod ? pod.center.y : minY + 0.7 * H;
    const podR = pod ? Math.max(pod.size.x, pod.size.z) / 2 : 0.6;

    for (const p of parts) {
      const src = p.mesh.material as THREE.MeshStandardMaterial;
      if (!src?.isMeshStandardMaterial) continue;
      const ext = Math.max(p.size.x, p.size.z);
      // Antenna/mast: thin geometry standing above the pod.
      const isMast = p.center.y > podY + 0.04 * H && ext < podR * 0.5;
      const m = src.clone();
      if (isMast) {
        m.color.set("#4b505a"); // dark metallic grey
        m.roughness = 0.5;
        m.metalness = 0.6;
        m.emissive = new THREE.Color("#0a0c10");
        m.emissiveIntensity = 0.2;
      } else {
        // Dark night-slate concrete so the shaft blends into the navy city
        // theme (the lit pod ring + beacon carry the vibrancy, like the real
        // tower at night). A faint warm self-glow keeps it from going flat.
        m.color.set("#2b3040");
        m.roughness = 0.85;
        m.metalness = 0.05;
        m.emissive = new THREE.Color("#2a2316");
        m.emissiveIntensity = 0.14;
      }
      p.mesh.material = m;
    }

    return { axisX: axis.x, axisZ: axis.z, podY, podR, tipY: maxY };
  }, [scene]);

  const { axisX, axisZ, podY, podR, tipY } = info;

  return (
    <group scale={scale} position={position}>
      <primitive object={scene} />

      {/* Warm accent ring around the SkyPod (amber emissive — blooms at night). */}
      <mesh position={[axisX, podY, axisZ]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[podR * 1.05, podR * 0.07, 6, 20]} />
        <meshStandardMaterial
          color="#1a1407"
          emissive="#ffd49a"
          emissiveIntensity={1.7}
          roughness={0.5}
          flatShading
        />
      </mesh>
      {/* Warm glow spilling from the pod. */}
      <pointLight position={[axisX, podY, axisZ]} intensity={12} distance={9} color="#ffdca0" />

      {/* Red aviation beacon at the antenna tip. */}
      <mesh position={[axisX, tipY + podR * 0.15, axisZ]}>
        <sphereGeometry args={[Math.max(0.06, podR * 0.09), 8, 8]} />
        <meshStandardMaterial color="#ff3030" emissive="#ff1a1a" emissiveIntensity={3.2} />
      </mesh>
      <pointLight position={[axisX, tipY, axisZ]} intensity={2.5} distance={6} color="#ff3b3b" />
    </group>
  );
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
