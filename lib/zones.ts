import type { SectionId, ZoneConfig } from "@/types";
import type { Vector3Tuple } from "three";
import { GROUND_Y } from "@/components/canvas/Island";

/**
 * The CN Tower's footprint — the skyline centerpiece (ambient, non-interactive).
 */
export const TOWER_POSITION: Vector3Tuple = [0, GROUND_Y, -5];

/**
 * The four landmark zones on the (bigger) Toronto map:
 *   Experience → Union Station + GO train ·
 *   Projects → building under construction ·
 *   Skills → the "TORONTO" sign in the plaza ·
 *   Contact → waterfront ferry dock.
 */
export const ZONES: ZoneConfig[] = [
  {
    id: "experience",
    label: "Experience",
    // Union Station — moved far WEST so the three landmarks aren't bunched.
    position: [-19, GROUND_Y, -4],
    color: "#3fae6b", // GO-train green
    cameraTarget: {
      position: [-24, 5, 5],
      lookAt: [-19, 1.6, -4],
    },
  },
  {
    id: "projects",
    label: "Projects",
    // Construction site — moved far EAST, opposite Union Station.
    position: [18, GROUND_Y, -5],
    color: "#4d9bff", // construction / glass blue
    cameraTarget: {
      position: [23.5, 7, 4],
      lookAt: [18, 3, -5],
    },
  },
  {
    id: "skills",
    label: "Skills",
    // The "TORONTO" billboard, standing in the plaza south of the CN Tower (just
    // clear of the waterfront avenue).
    position: [-1, GROUND_Y, -0.3],
    color: "#ffcf6b", // warm neon billboard accent
    cameraTarget: {
      position: [-1, 2.7, 8.5],
      lookAt: [-1, 2.0, -0.3],
    },
  },
  {
    id: "contact",
    label: "Contact",
    position: [3, GROUND_Y, 10],
    color: "#22d3c5", // waterfront teal
    cameraTarget: {
      position: [5.5, 4.5, 17.5],
      lookAt: [3, 0.9, 10],
    },
  },
];

/** Quick id → config lookup for UI (overlay/nav accent theming, labels). */
export const ZONE_BY_ID: Record<SectionId, ZoneConfig> = Object.fromEntries(
  ZONES.map((z) => [z.id, z]),
) as Record<SectionId, ZoneConfig>;
