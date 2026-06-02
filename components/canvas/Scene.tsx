import SceneEnvironment from "./Environment";
import Island from "./Island";

/**
 * Assembles the 3D world. Rendered as a direct child of the `<Canvas>` so
 * the environment's `<color>`/`<fog>` attach onto the scene root.
 *
 * Zones (Step 3) and the camera rig (Step 4) plug in here next.
 */
export default function Scene() {
  return (
    <>
      <SceneEnvironment />
      <Island />
    </>
  );
}
