import SceneEnvironment from "./Environment";
import Island from "./Island";
import City from "./City";
import Zone from "./Zone";
import { ZONES } from "@/lib/zones";
import { usePortfolio } from "@/lib/store";

/**
 * Assembles the night-time Toronto world. Rendered as a direct child of the
 * `<Canvas>` so the environment's `<color>`/`<fog>` attach onto the scene root.
 *
 * Clicking a zone landmark sets the active section; clicking the ground or
 * ambient city clears it (zones stop propagation so their clicks don't bubble),
 * and the Canvas's `onPointerMissed` handles clicks that hit nothing at all.
 */
export default function Scene() {
  const setActiveSection = usePortfolio((s) => s.setActiveSection);

  return (
    <>
      <SceneEnvironment />

      {/* Ground + ambient city — clicking either deselects. */}
      <group onClick={() => setActiveSection(null)}>
        <Island />
        <City />
      </group>

      {ZONES.map((config) => (
        <Zone key={config.id} config={config} />
      ))}
    </>
  );
}
