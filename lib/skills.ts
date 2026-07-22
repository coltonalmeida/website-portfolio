/**
 * Skills shown in the Skills overlay's horizontal "Core Skills" marquee.
 * `kind` is the small uppercase category label on each card; `name` is the
 * skill itself. Mirrors the Technical Skills section of the résumé — add here
 * and the marquee + search pick it up automatically.
 */
export type SkillKind = "Language" | "Framework" | "Tool" | "Library";

export interface Skill {
  name: string;
  kind: SkillKind;
}

export const SKILLS: Skill[] = [
  { name: "Python", kind: "Language" },
  { name: "TypeScript", kind: "Language" },
  { name: "JavaScript", kind: "Language" },
  { name: "SQL", kind: "Language" },
  { name: "HTML", kind: "Language" },
  { name: "CSS", kind: "Language" },
  { name: "React", kind: "Framework" },
  { name: "Node.js", kind: "Framework" },
  { name: "Express", kind: "Framework" },
  { name: "FastAPI", kind: "Framework" },
  { name: "FastMCP", kind: "Framework" },
  { name: "Tailwind CSS", kind: "Framework" },
  { name: "Git", kind: "Tool" },
  { name: "VS Code", kind: "Tool" },
  { name: "Docker", kind: "Tool" },
  { name: "GitHub Actions", kind: "Tool" },
  { name: "PostgreSQL", kind: "Tool" },
  { name: "PyTorch", kind: "Library" },
  { name: "Stable-Baselines3", kind: "Library" },
  { name: "OpenCV", kind: "Library" },
  { name: "Whisper", kind: "Library" },
  { name: "Pydantic", kind: "Library" },
  { name: "VoyageAI", kind: "Library" },
];
