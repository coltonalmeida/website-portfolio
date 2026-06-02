/**
 * Skills shown in the Skills overlay's horizontal "Core Skills" marquee.
 * `kind` is the small uppercase category label on each card; `name` is the
 * skill itself. This is placeholder content — swap in the real toolkit here and
 * the marquee + search pick it up automatically.
 */
export type SkillKind = "Language" | "Framework" | "Tool" | "Platform";

export interface Skill {
  name: string;
  kind: SkillKind;
}

export const SKILLS: Skill[] = [
  { name: "TypeScript", kind: "Language" },
  { name: "JavaScript", kind: "Language" },
  { name: "Python", kind: "Language" },
  { name: "C++", kind: "Language" },
  { name: "C", kind: "Language" },
  { name: "Rust", kind: "Language" },
  { name: "Java", kind: "Language" },
  { name: "SQL", kind: "Language" },
  { name: "React", kind: "Framework" },
  { name: "Next.js", kind: "Framework" },
  { name: "Three.js / R3F", kind: "Framework" },
  { name: "Node.js", kind: "Framework" },
  { name: "Tailwind CSS", kind: "Framework" },
  { name: "WebGL", kind: "Tool" },
  { name: "Git", kind: "Tool" },
  { name: "Docker", kind: "Tool" },
  { name: "Vercel", kind: "Platform" },
];
