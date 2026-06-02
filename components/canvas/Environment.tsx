import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * Night-time sky, lighting, and atmosphere for the low-poly Toronto scene.
 *
 * - A **gradient sky dome** (zenith navy → a warm city-glow horizon) gives the
 *   sky depth and, crucially, blends the far edge of Lake Ontario into the
 *   horizon so the water no longer "ends abruptly".
 * - A **custom starfield** (its own non-fogged Points) — the previous drei
 *   `<Stars>` were washed out by fog; these sit inside the dome and stay bright.
 * - A pale **moon** + cool **moonlight** key (casts shadows), plus low cool
 *   ambient/hemisphere so the emissive city carries the light.
 *
 * `<color>` / `<fog>` use `attach` to bind onto the scene, so this must be a
 * direct child of the scene (not wrapped in a `<group>`).
 */
const HORIZON = "#101a33"; // fog + sky horizon share this so the lake dissolves

export default function SceneEnvironment() {
  return (
    <>
      <color attach="background" args={[HORIZON]} />
      <fog attach="fog" args={[HORIZON, 40, 150]} />

      <ambientLight intensity={0.2} color="#5566aa" />
      <hemisphereLight args={["#27407a", "#05060c", 0.4]} position={[0, 40, 0]} />

      {/* Moonlight key — cool, high, north-west; casts the scene's shadows. */}
      <directionalLight
        position={[-22, 30, -16]}
        intensity={0.6}
        color="#cdd6ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-30, 30, 30, -30, 0.1, 90]}
        />
      </directionalLight>

      {/* Moon */}
      <group position={[-34, 38, -40]}>
        <mesh>
          <sphereGeometry args={[3.4, 24, 24]} />
          <meshStandardMaterial
            color="#eef2ff"
            emissive="#dfe6ff"
            emissiveIntensity={1.2}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[4.6, 24, 24]} />
          <meshBasicMaterial color="#9fb0e0" transparent opacity={0.1} fog={false} />
        </mesh>
      </group>

      <SkyDome />
      <Starfield />
    </>
  );
}

/** Inverted sphere with a vertical gradient (navy zenith → warm horizon glow). */
function SkyDome() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.0, "#05070f"); // zenith
    g.addColorStop(0.45, "#0a1126");
    g.addColorStop(0.52, "#16203f"); // horizon band
    g.addColorStop(0.6, "#2a2740"); // faint warm city glow under the horizon
    g.addColorStop(0.75, "#0b1020");
    g.addColorStop(1.0, "#05070f"); // nadir
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh>
      <sphereGeometry args={[200, 32, 24]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.BackSide}
        fog={false}
        depthWrite={false}
      />
    </mesh>
  );
}

/** A bright, non-fogged starfield on a large sphere (twinkles slightly). */
function Starfield() {
  const geometry = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    // Deterministic placement (pure hash, no mutable state) so screenshots
    // are stable across reloads.
    const hash = (n: number) => {
      const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };
    for (let i = 0; i < count; i++) {
      // Upper hemisphere only (stars above the horizon).
      const u = hash(i * 4);
      const v = hash(i * 4 + 1) * 0.85 + 0.05;
      const theta = u * Math.PI * 2;
      const phi = Math.acos(v); // bias toward the top
      const r = 150;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = hash(i * 4 + 2) < 0.12 ? 2.4 : 1.0 + hash(i * 4 + 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#dfe8ff"
        size={1.4}
        sizeAttenuation
        transparent
        opacity={0.95}
        fog={false}
        depthWrite={false}
      />
    </points>
  );
}
