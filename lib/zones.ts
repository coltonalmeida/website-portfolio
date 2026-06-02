import type { SectionId, ZoneConfig } from "@/types";
import { GROUND_Y } from "@/components/canvas/Island";

/**
 * The four landmark zones, re-mapped to Toronto-at-night landmarks:
 *   Experience → CN Tower · Projects → Financial District towers ·
 *   Skills → TTC streetcar / workshop block · Contact → waterfront ferry dock.
 * Each carries its world position, accent color, and the camera framing used
 * when it becomes the active section. Single place to retune placement/angles.
 */
export const ZONES: ZoneConfig[] = [
  {
    id: "experience",
    label: "Experience",
    position: [-2.5, GROUND_Y, -3],
    color: "#ff2d75", // CN Tower colour-changing lights
    cameraTarget: {
      position: [5, 7.5, 7.5],
      lookAt: [-2.5, 5.5, -3],
    },
  },
  {
    id: "projects",
    label: "Projects",
    position: [4.8, GROUND_Y, -4.5],
    color: "#4d9bff", // Financial District glass
    cameraTarget: {
      position: [11.5, 6, 5.5],
      lookAt: [4.8, 3.4, -4.5],
    },
  },
  {
    id: "skills",
    label: "Skills",
    position: [-6.5, GROUND_Y, 1.8],
    color: "#ffb454", // workshop / streetcar warmth
    cameraTarget: {
      position: [-11.5, 4, 8.5],
      lookAt: [-6.5, 1.3, 1.8],
    },
  },
  {
    id: "contact",
    label: "Contact",
    position: [2.5, GROUND_Y, 6.5],
    color: "#22d3c5", // waterfront teal
    cameraTarget: {
      position: [5, 4, 13.5],
      lookAt: [2.5, 0.9, 6.5],
    },
  },
];

/** Quick id → config lookup for UI (overlay/nav accent theming, labels). */
export const ZONE_BY_ID: Record<SectionId, ZoneConfig> = Object.fromEntries(
  ZONES.map((z) => [z.id, z]),
) as Record<SectionId, ZoneConfig>;
