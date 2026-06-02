/**
 * Scene lighting, fog, and background for the low-poly island.
 *
 * Code-based (no HDRI) to keep the bundle lean and the look stylized:
 * a hemisphere fill for soft sky/ground bounce, a key directional light
 * that casts shadows, a flat sky-blue background, and gentle fog so the
 * water fades into the horizon. Named `SceneEnvironment` to avoid clashing
 * with drei's `Environment` helper.
 *
 * `<color>` / `<fog>` use `attach` to bind onto the R3F scene, so this
 * component must be rendered as a direct child of the scene (not wrapped
 * in a `<group>`).
 */
const SKY = "#bfe3f2";

export default function SceneEnvironment() {
  return (
    <>
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 22, 55]} />

      <hemisphereLight
        args={["#dff1ff", "#5a7a52", 0.9]}
        position={[0, 20, 0]}
      />
      <ambientLight intensity={0.25} />

      <directionalLight
        position={[10, 14, 8]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        {/* Tighten the shadow frustum around the island for crisp shadows. */}
        <orthographicCamera
          attach="shadow-camera"
          args={[-12, 12, 12, -12, 0.1, 40]}
        />
      </directionalLight>
    </>
  );
}
