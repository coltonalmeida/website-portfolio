import SceneEnvironment from "./Environment";
import Island from "./Island";
import Zone from "./Zone";
import { ZONES } from "@/lib/zones";
import { usePortfolio } from "@/lib/store";

/**
 * Assembles the 3D world. Rendered as a direct child of the `<Canvas>` so
 * the environment's `<color>`/`<fog>` attach onto the scene root.
 *
 * The camera rig (Step 4) plugs in here next. Clicking a zone sets the active
 * section; clicking the island ground clears it (zones stop propagation so
 * their clicks don't bubble to the ground handler), and the Canvas's
 * `onPointerMissed` (in Experience) handles clicks that hit nothing at all.
 */
export default function Scene() {
  const setActiveSection = usePortfolio((s) => s.setActiveSection);

  return (
    <>
      <SceneEnvironment />

      <Island onClick={() => setActiveSection(null)} />

      {ZONES.map((config) => (
        <Zone key={config.id} config={config} />
      ))}
    </>
  );
}
