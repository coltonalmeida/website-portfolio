import type { ZoneConfig } from "@/types";
import { GRASS_TOP } from "@/components/canvas/Island";

/**
 * The four landmark zones, placed near the cardinal edges of the grass
 * plateau. Each carries its world position, accent color, and the camera
 * framing used when it becomes the active section. This array is the single
 * place to retune placement or camera angles.
 */
export const ZONES: ZoneConfig[] = [
  {
    id: "skills",
    label: "Skills",
    position: [-4.5, GRASS_TOP, 0],
    color: "#f59e0b", // amber — workbench tools
    cameraTarget: {
      position: [-9.5, 5.5, 3.5],
      lookAt: [-4.5, 2.2, 0],
    },
  },
  {
    id: "projects",
    label: "Projects",
    position: [0, GRASS_TOP, -4.5],
    color: "#3b82f6", // blue — building cluster
    cameraTarget: {
      position: [3.5, 5.5, -9.5],
      lookAt: [0, 2.2, -4.5],
    },
  },
  {
    id: "experience",
    label: "Experience",
    position: [4.5, GRASS_TOP, 0],
    color: "#8b5cf6", // violet — the journey up
    cameraTarget: {
      position: [9.5, 5.5, 3.5],
      lookAt: [4.5, 2.4, 0],
    },
  },
  {
    id: "contact",
    label: "Contact",
    position: [0, GRASS_TOP, 4.5],
    color: "#ef4444", // red — lighthouse beacon
    cameraTarget: {
      position: [-3.5, 5.5, 9.5],
      lookAt: [0, 2.8, 4.5],
    },
  },
];
