import type { Vector3Tuple } from "three";

/** The four portfolio sections, each mapped to a landmark zone on the island. */
export type SectionId = "skills" | "projects" | "experience" | "contact";

/** Where the camera sits and what it looks at when a zone is focused. */
export interface CameraTarget {
  /** Camera position in world space. */
  position: Vector3Tuple;
  /** The point the camera frames. */
  lookAt: Vector3Tuple;
}

/**
 * Static metadata for one landmark. Drives both the in-scene placement of the
 * `Zone` and the camera fly-to (Step 4), plus the overlay/nav labels.
 */
export interface ZoneConfig {
  id: SectionId;
  /** Human-readable label for nav buttons and the overlay heading. */
  label: string;
  /** Landmark placement on the grass plateau (world space). */
  position: Vector3Tuple;
  /** Accent color for the landmark's signature parts and hover glow. */
  color: string;
  /** Camera framing applied when this zone becomes the active section. */
  cameraTarget: CameraTarget;
}
