"use client";

import { usePortfolio } from "@/lib/store";
import { ZONES } from "@/lib/zones";

/**
 * The site header + section navigation. These are real `<button>`s, so they
 * double as the accessible, keyboard-operable, no-WebGL fallback: activating
 * one drives the same store as clicking a 3D landmark. Hovering a button sets
 * `hoveredSection` so the matching landmark lights up in the scene.
 */
export default function Nav() {
  const activeSection = usePortfolio((s) => s.activeSection);
  const setActiveSection = usePortfolio((s) => s.setActiveSection);
  const setHoveredSection = usePortfolio((s) => s.setHoveredSection);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="pointer-events-auto select-none">
        <h1 className="text-lg font-semibold tracking-tight text-white drop-shadow">
          Colton Almeida
        </h1>
        <p className="text-xs text-white/70 drop-shadow">
          Toronto at night — click a landmark or use the menu
        </p>
      </div>

      <nav aria-label="Sections" className="pointer-events-auto">
        <ul className="flex flex-wrap gap-2">
          {ZONES.map((zone) => {
            const isActive = activeSection === zone.id;
            return (
              <li key={zone.id}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    setActiveSection(isActive ? null : zone.id)
                  }
                  onPointerEnter={() => setHoveredSection(zone.id)}
                  onPointerLeave={() => setHoveredSection(null)}
                  onFocus={() => setHoveredSection(zone.id)}
                  onBlur={() => setHoveredSection(null)}
                  className="rounded-full border px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  style={{
                    borderColor: isActive ? zone.color : "rgba(255,255,255,0.18)",
                    backgroundColor: isActive
                      ? hexToRgba(zone.color, 0.22)
                      : "rgba(255,255,255,0.06)",
                  }}
                >
                  {zone.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

/** Expand a #rrggbb hex into an rgba() string at the given alpha. */
function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
