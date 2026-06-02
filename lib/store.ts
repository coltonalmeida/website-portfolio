import { create } from "zustand";
import type { SectionId } from "@/types";

/**
 * The single source of truth tying the 3D scene and the DOM overlay together.
 * Both the camera rig (flies to the active zone / home) and the overlay (shows
 * that section's content) react to `activeSection`. `hoveredSection` keeps the
 * 3D landmarks and the fallback nav highlight in sync.
 */
interface PortfolioState {
  activeSection: SectionId | null;
  hoveredSection: SectionId | null;
  setActiveSection: (id: SectionId | null) => void;
  setHoveredSection: (id: SectionId | null) => void;
}

export const usePortfolio = create<PortfolioState>((set) => ({
  activeSection: null,
  hoveredSection: null,
  setActiveSection: (id) => set({ activeSection: id }),
  setHoveredSection: (id) => set({ hoveredSection: id }),
}));
