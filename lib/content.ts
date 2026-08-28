import type { SectionId } from "@/types";

/**
 * Section content for the DOM overlays. Keep the shape stable
 * (`title` / `tagline` / optional `body` / `items`) and the overlay + nav pick
 * it up automatically.
 */
export interface SectionItem {
  label: string;
  /** Award/honour banner. Projects only; renders as an accent pill above the title. */
  award?: string;
  /** Tech stack. Present only on projects; renders as its own mini box above `detail`. */
  stack?: string;
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
  /** Intro line. Omit it where the items below already say the same thing. */
  body?: string;
  items: SectionItem[];
}

export const CONTENT: Record<SectionId, SectionContent> = {
  skills: {
    title: "Skills",
    tagline: "What's in my toolkit.",
    body: "My toolkit.",
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
    body: "Source code on GitHub.",
    items: [
      {
        label: "Loadshift",
        award: "Ignition Hacks v7 · 1st Overall",
        stack: "Python · FastAPI · LightGBM · Next.js · TypeScript · Render",
        detail:
          "Forecasts Ontario's marginal carbon intensity 24h ahead and names the cleanest hour to run a load · 1st Overall, Best Solo Hack, 2nd Best Use of Render",
        href: "https://github.com/coltonalmeida/Loadshift",
        liveHref: "https://loadshift-web.onrender.com/",
      },
      {
        label: "Twitch to TikTok Clipper",
        stack: "Python · FFmpeg · OpenCV · Whisper · Claude API",
        detail:
          "Automated 9:16 clip pipeline · 50K+ views in the first month",
        href: "https://github.com/coltonalmeida/twitch-clipper",
      },
      {
        label: "FluentKeys",
        stack: "React 19 · TypeScript · Express · PostgreSQL · Clerk",
        detail:
          "Typing trainer with a real-time engine and global leaderboard · 200 users",
        href: "https://github.com/coltonalmeida/fluentkeys",
        liveHref: "https://fluentkeys.com",
      },
      {
        label: "space-invaders-rl",
        stack: "PyTorch · Stable-Baselines3 · Gymnasium",
        detail:
          "PPO agent from raw pixels · mean reward 983 (2.1× baseline) after 10M steps",
        href: "https://github.com/coltonalmeida/space-invaders-rl",
      },
    ],
  },
  experience: {
    title: "Experience",
    tagline: "Union Station",
    // No body — the Work / Education headings below already say it.
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
