import type { SectionId } from "@/types";

/**
 * Section content for the DOM overlays. Keep the shape stable
 * (`title` / `tagline` / `body` / `items`) and the overlay + nav pick it up
 * automatically.
 */
export interface SectionItem {
  label: string;
  detail?: string;
  /** Repo / profile / mailto — turns the item label into a link. */
  href?: string;
  /** Optional second link (live site), rendered as a small pill. */
  liveHref?: string;
  /**
   * Optional heading this item sits under. `Timeline` groups consecutive items
   * that share one, so ordering here drives the rendered grouping.
   */
  group?: string;
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
    tagline: "What's in my toolkit",
    body: "The languages, frameworks, and libraries I actually build with — from Python data and ML work to full-stack TypeScript.",
    // Certifications. The toolkit itself lives in lib/skills.ts and is rendered
    // by <SkillsMarquee />; these render underneath it as a grid.
    items: [
      {
        label: "CS50P: Introduction to Programming with Python",
        detail: "Harvard University",
      },
      { label: "Building with the Claude API", detail: "Anthropic" },
      { label: "AI Fluency Framework & Foundations", detail: "Anthropic" },
      { label: "French as a Second Language", detail: "DPCDSB" },
      { label: "IB Diploma", detail: "St Francis Xavier CSS" },
    ],
  },
  projects: {
    title: "Projects",
    tagline: "Under construction",
    body: "Things I've built end to end — a video automation pipeline, a full-stack web app, and a deep RL agent. Source is on GitHub.",
    items: [
      {
        label: "Twitch to TikTok Clipper",
        detail:
          "Python · FFmpeg · OpenCV · Whisper · Claude API — automated 9:16 clip pipeline; 50K+ views in the first month",
        href: "https://github.com/coltonalmeida/twitch-clipper",
      },
      {
        label: "FluentKeys",
        detail:
          "React 19 · TypeScript · Express · PostgreSQL · Clerk — typing trainer with a real-time engine and global leaderboard",
        href: "https://github.com/coltonalmeida/fluentkeys",
        liveHref: "https://fluentkeys.com",
      },
      {
        label: "space-invaders-rl",
        detail:
          "PyTorch · Stable-Baselines3 · Gymnasium — PPO agent from raw pixels; mean reward 983 (2.1× baseline) after 10M steps",
        href: "https://github.com/coltonalmeida/space-invaders-rl",
      },
    ],
  },
  experience: {
    title: "Experience",
    tagline: "Union Station",
    body: "The path so far — where I've worked and where I'm studying.",
    items: [
      {
        group: "Work",
        label: "Skate Patroller",
        detail: "City of Mississauga · Jan 2023 – Present",
      },
      {
        group: "Education",
        label: "University of Toronto, St. George",
        detail: "B.A.Sc. Electrical & Computer Engineering · Sep 2026 – 2031",
      },
    ],
  },
  contact: {
    title: "Contact",
    tagline: "The waterfront",
    body: "Let's build something. Reach out and I'll get back to you.",
    items: [
      {
        label: "Email",
        detail: "almeidacolton87@gmail.com",
        href: "mailto:almeidacolton87@gmail.com",
      },
      {
        label: "GitHub",
        detail: "github.com/coltonalmeida",
        href: "https://github.com/coltonalmeida",
      },
      {
        label: "LinkedIn",
        detail: "linkedin.com/in/colton-almeida",
        href: "https://linkedin.com/in/colton-almeida",
      },
    ],
  },
};
