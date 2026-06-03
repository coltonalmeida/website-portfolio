import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * An overhead **mast-arm traffic signal**, isolated from the Sketchfab
 * "Traffic Lights (animation) – free" GLB (CC-BY). That file is actually a whole
 * modular street scene with **no baked animation**, so we keep only the subtree
 * under the `Traffic Signal_67` node (upright pole + horizontal arm + three
 * signal heads) and drive the red/amber/green cycle ourselves in `useFrame`.
 *
 * Default orientation (rot = 0): arm reaches toward +X, heads face −Z. Lenses are
 * identified by their source material name — `Material.003` red, `Material.004`
 * amber, `Material.005` green — tagged on `material.userData.role` and animated
 * via the rendered object's ref (so we never mutate a memoised value). `phase`
 * offsets the cross-street signals by half a cycle so perpendicular one-way
 * directions are never green together.
 */
const URL = "/models/traffic-signal.glb";
// NB: the GLB node is authored "Traffic Signal_67", but Three's GLTFLoader runs
// every name through PropertyBinding.sanitizeNodeName, which turns spaces into
// underscores — so at runtime it is "Traffic_Signal_67". Looking up the raw
// (spaced) name fails and would otherwise fall through to keeping the WHOLE GLB
// (a full modular street scene), leaking road/sidewalk models into the city.
const SIGNAL_NODE = "Traffic_Signal_67";

// Cycle timing (seconds). One direction is green, then amber, while the other is
// red; then they swap. `phase` shifts this signal by half the full cycle.
const GREEN = 3.5;
const AMBER = 1.1;
const HALF = GREEN + AMBER; // one direction's green+amber window
const CYCLE = HALF * 2;

const ON = 4.5;
const OFF = 0.03;

type Lenses = {
  red: THREE.MeshStandardMaterial[];
  amber: THREE.MeshStandardMaterial[];
  green: THREE.MeshStandardMaterial[];
};

export default function TrafficSignal({
  position,
  rotation = 0,
  scale = 0.4,
  phase = 0,
}: {
  position: [number, number, number];
  rotation?: number;
  scale?: number;
  phase?: 0 | 1;
}) {
  const { scene } = useGLTF(URL);

  const obj = useMemo(() => {
    const clone = scene.clone(true);

    // Locate the signal subtree. Try the sanitized name first, then any node
    // whose name mentions "signal" — but NEVER fall back to the whole scene
    // (that would render the GLB's modular street pieces all over the map).
    let signal = clone.getObjectByName(SIGNAL_NODE);
    if (!signal) clone.traverse((o) => { if (!signal && /signal/i.test(o.name)) signal = o; });
    if (!signal) return new THREE.Group(); // render nothing rather than the street

    // Keep only the meshes belonging to the signal subtree; drop the rest of the
    // modular street scene. Keeping the full ancestor chain preserves the GLB's
    // upright (Y-up) orientation.
    const keep = new Set<THREE.Object3D>();
    signal.traverse((o) => keep.add(o));
    const remove: THREE.Object3D[] = [];
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !keep.has(o)) remove.push(o);
    });
    remove.forEach((m) => m.parent?.remove(m));

    // Recentre: pole foot → x0, base → ground (y0), heads centred on z0.
    clone.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(signal);
    clone.position.add(
      new THREE.Vector3(-box.min.x, -box.min.y, -(box.min.z + box.max.z) / 2),
    );

    // Clone + classify materials so each lens animates independently and the
    // housing/baked-on bits don't glow. Tag each lens with a role for useFrame.
    signal.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const src = mesh.material as THREE.MeshStandardMaterial;
      if (!src?.isMeshStandardMaterial) return;
      const m = src.clone();
      mesh.material = m;
      switch (src.name) {
        case "Material.003": // red lens (top)
          m.color.set("#360000");
          m.emissive = new THREE.Color("#ff2a2a");
          m.toneMapped = false; // let it bloom past tone mapping
          m.userData.role = "red";
          break;
        case "Material.004": // amber lens (mid)
          m.color.set("#3a2400");
          m.emissive = new THREE.Color("#ffae33");
          m.toneMapped = false;
          m.userData.role = "amber";
          break;
        case "Material.005": // green lens (bottom)
          m.color.set("#062808");
          m.emissive = new THREE.Color("#33ff66");
          m.toneMapped = false;
          m.userData.role = "green";
          break;
        default:
          // Housing, pole, arm, and small baked-emissive bits → dark, unlit.
          m.color.multiplyScalar(0.45);
          m.emissive = new THREE.Color("#000000");
          m.emissiveIntensity = 0;
          m.roughness = 0.85;
          m.metalness = 0.3;
      }
    });

    return clone;
  }, [scene]);

  // Animate via the rendered object's ref (mutable container), gathering the
  // tagged lens materials once and caching them on the object's userData.
  const rootRef = useRef<THREE.Object3D | null>(null);
  useFrame((state) => {
    const root = rootRef.current;
    if (!root) return;
    let lens = root.userData.lensCache as Lenses | undefined;
    if (!lens) {
      lens = { red: [], amber: [], green: [] };
      root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const m = mesh.material as THREE.MeshStandardMaterial;
        const role = m?.userData?.role as keyof Lenses | undefined;
        if (role) lens![role].push(m);
      });
      root.userData.lensCache = lens;
    }

    const t = (state.clock.elapsedTime + phase * HALF) % CYCLE;
    // This signal is green for [0, GREEN), amber for [GREEN, HALF), red after.
    let g = OFF,
      a = OFF,
      r = OFF;
    if (t < GREEN) g = ON;
    else if (t < HALF) a = ON;
    else r = ON;
    for (const m of lens.green) m.emissiveIntensity = g;
    for (const m of lens.amber) m.emissiveIntensity = a;
    for (const m of lens.red) m.emissiveIntensity = r;
  });

  return (
    <primitive
      ref={rootRef}
      object={obj}
      position={position}
      rotation={[0, rotation, 0]}
      scale={scale}
    />
  );
}

useGLTF.preload(URL);
