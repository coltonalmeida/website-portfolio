import type { SectionId, ZoneConfig } from "@/types";
import type { Vector3Tuple } from "three";
import { GROUND_Y } from "@/components/canvas/Island";

/**
 * The CN Tower's footprint — the skyline centerpiece. The Skills ticker wraps
 * its shaft here, so the Skills zone shares this position.
 */
export const TOWER_POSITION: Vector3Tuple = [0, GROUND_Y, -5];

/**
 * The four landmark zones on the (bigger) Toronto map:
 *   Experience → Union Station + GO train ·
 *   Projects → building under construction ·
 *   Skills → LED ticker wrapped on the CN Tower ·
 *   Contact → waterfront ferry dock.
 */
export const ZONES: ZoneConfig[] = [
  {
    id: "experience",
    label: "Experience",
    position: [-10, GROUND_Y, 0],
    color: "#3fae6b", // GO-train green
    cameraTarget: {
      position: [-15.5, 5, 8.5],
      lookAt: [-10, 1.6, 0.5],
    },
  },
  {
    id: "projects",
    label: "Projects",
    position: [7.5, GROUND_Y, -2.5],
    color: "#4d9bff", // construction / glass blue
    cameraTarget: {
      position: [14.5, 7, 5.5],
      lookAt: [7.5, 3, -2],
    },
  },
  {
    id: "skills",
    label: "Skills",
    position: TOWER_POSITION,
    color: "#ffb454", // amber LED ticker
    noLift: true,
    cameraTarget: {
      position: [6.5, 6.5, 4.5],
      lookAt: [0, 5, -5],
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
