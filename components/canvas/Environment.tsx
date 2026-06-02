import { Stars } from "@react-three/drei";

/**
 * Night-time lighting, fog, sky, stars, and the moon for the low-poly Toronto
 * scene. Deliberately dark and cool so the city's emissive windows, the lit CN
 * Tower, street lamps, and headlights carry the light. Named `SceneEnvironment`
 * to avoid clashing with drei's `Environment` helper.
 *
 * `<color>` / `<fog>` use `attach` to bind onto the R3F scene, so this must be
 * a direct child of the scene (not wrapped in a `<group>`).
 */
const NIGHT_SKY = "#070b18";
const FOG = "#0a1226";

export default function SceneEnvironment() {
  return (
    <>
      <color attach="background" args={[NIGHT_SKY]} />
      <fog attach="fog" args={[FOG, 24, 70]} />

      {/* Low cool ambient + sky/ground hemisphere so nothing is pure black. */}
      <ambientLight intensity={0.18} color="#5566aa" />
      <hemisphereLight args={["#27407a", "#05060c", 0.35]} position={[0, 30, 0]} />

      {/* Moonlight — a soft, cool key from high to the north-west, casts shadows. */}
      <directionalLight
        position={[-16, 22, -10]}
        intensity={0.55}
        color="#cdd6ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-18, 18, 18, -18, 0.1, 60]}
        />
      </directionalLight>

      {/* The moon itself — a pale emissive disc up in the sky. */}
      <group position={[-22, 26, -26]}>
        <mesh>
          <sphereGeometry args={[2.6, 24, 24]} />
          <meshStandardMaterial
            color="#eef2ff"
            emissive="#dfe6ff"
            emissiveIntensity={1.1}
          />
        </mesh>
        {/* Faint halo */}
        <mesh>
          <sphereGeometry args={[3.4, 24, 24]} />
          <meshBasicMaterial color="#9fb0e0" transparent opacity={0.12} />
        </mesh>
      </group>

      {/* Starfield */}
      <Stars
        radius={120}
        depth={60}
        count={2200}
        factor={4}
        saturation={0}
        fade
        speed={0.6}
      />
    </>
  );
}
