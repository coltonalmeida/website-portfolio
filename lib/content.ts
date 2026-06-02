import type { SectionId } from "@/types";

/**
 * Placeholder section content. This is the swap point for real portfolio copy —
 * keep the shape stable (`title` / `tagline` / `body` / `items`) and the overlay
 * + nav pick it up automatically.
 */
export interface SectionItem {
  label: string;
  detail?: string;
}

export interface SectionContent {
  title: string;
  tagline: string;
  body: string;
  items: SectionItem[];
}

export const CONTENT: Record<SectionId, SectionContent> = {
  skills: {
    title: "Skills",
    tagline: "The CN Tower ticker",
    body: "Tools and technologies I reach for to design and ship interactive products end to end.",
    items: [
      { label: "TypeScript & React", detail: "App Router, hooks, suspense" },
      { label: "Three.js / R3F", detail: "Declarative 3D for the web" },
      { label: "Node & APIs", detail: "Services, data, integrations" },
      { label: "UI & motion", detail: "Tailwind, design systems, animation" },
    ],
  },
  projects: {
    title: "Projects",
    tagline: "Under construction",
    body: "A few things I've designed and built. Replace these with real case studies, links, and screenshots.",
    items: [
      { label: "Project One", detail: "Interactive data viz dashboard" },
      { label: "Project Two", detail: "Realtime collaborative tool" },
      { label: "Project Three", detail: "This 3D portfolio world" },
    ],
  },
  experience: {
    title: "Experience",
    tagline: "Union Station",
    body: "The path so far — roles, milestones, and the work that shaped how I build.",
    items: [
      { label: "Senior Engineer", detail: "Company · 2023 – present" },
      { label: "Software Engineer", detail: "Company · 2021 – 2023" },
      { label: "Junior Developer", detail: "Company · 2019 – 2021" },
    ],
  },
  contact: {
    title: "Contact",
    tagline: "The waterfront",
    body: "Let's build something. Reach out and I'll get back to you.",
    items: [
      { label: "Email", detail: "almeidacolton87@gmail.com" },
      { label: "GitHub", detail: "github.com/your-handle" },
      { label: "LinkedIn", detail: "linkedin.com/in/your-handle" },
    ],
  },
};
