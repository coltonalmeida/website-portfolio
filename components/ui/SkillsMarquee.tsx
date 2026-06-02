"use client";

import { useMemo, useState } from "react";
import { SKILLS, type Skill } from "@/lib/skills";

/**
 * The Skills section's "Core Skills" strip: a horizontal row of skill cards
 * that auto-scrolls (a marquee that "goes around" by looping), **pauses on
 * hover** so you can read it, and can be **filtered with the search box**. When
 * a query is present the marquee stops and the matching cards lay out statically.
 *
 * Real DOM (accessible / selectable), per the no-3D-text rule — the 3D scene
 * stays the backdrop while this is the actual Skills content.
 */
export default function SkillsMarquee({ accent }: { accent: string }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      q
        ? SKILLS.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.kind.toLowerCase().includes(q),
          )
        : SKILLS,
    [q],
  );
  const searching = q.length > 0;

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: accent }}
          >
            Core Skills
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Search to confirm a language or framework is in my toolkit.
          </p>
        </div>
        <label className="relative block w-full sm:w-64">
          <span className="sr-only">Search skills</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills…"
            className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus-visible:ring-2"
            style={{ "--tw-ring-color": accent } as React.CSSProperties}
          />
        </label>
      </div>

      {searching ? (
        filtered.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {filtered.map((s) => (
              <SkillCard key={s.name} skill={s} accent={accent} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-400">
            No skills match “{query}”.
          </p>
        )
      ) : (
        <div
          className="skills-marquee-group relative mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
          style={
            { "--marquee-duration": `${SKILLS.length * 2.6}s` } as React.CSSProperties
          }
        >
          {/* Two identical sets so the -50% loop is seamless. */}
          <div className="skills-marquee-track flex w-max gap-3">
            {[...SKILLS, ...SKILLS].map((s, i) => (
              <SkillCard
                key={`${s.name}-${i}`}
                skill={s}
                accent={accent}
                aria-hidden={i >= SKILLS.length}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SkillCard({
  skill,
  accent,
  ...rest
}: {
  skill: Skill;
  accent: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className="group/card w-44 shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 transition-colors hover:bg-white/[0.07]"
    >
      <span
        className="block text-[0.625rem] font-semibold uppercase tracking-[0.25em] text-zinc-500 transition-colors group-hover/card:text-[var(--accent)]"
        style={{ "--accent": accent } as React.CSSProperties}
      >
        {skill.kind}
      </span>
      <span className="mt-2 block text-lg font-semibold tracking-tight text-zinc-100">
        {skill.name}
      </span>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.5 10.5L14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
