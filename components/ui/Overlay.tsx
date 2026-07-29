"use client";

import { useEffect, useState } from "react";
import type { SectionId } from "@/types";
import { usePortfolio } from "@/lib/store";
import { CONTENT, type SectionItem } from "@/lib/content";
import { ZONE_BY_ID } from "@/lib/zones";
import SkillsMarquee from "./SkillsMarquee";

/**
 * DOM content panel for the active section. Reads `activeSection` from the
 * store and slides/fades in and out. Closes via its button, the Esc key, or
 * clicking empty 3D space (handled by the Canvas's `onPointerMissed`).
 *
 * `shown` retains the last section through the exit transition so the panel
 * animates out cleanly; `open` drives the enter/exit CSS transition (mounts
 * closed, a rAF flips it open). All state updates live inside rAF/timeout
 * callbacks to avoid synchronous setState-in-effect.
 */
export default function Overlay() {
  const activeSection = usePortfolio((s) => s.activeSection);
  const setActiveSection = usePortfolio((s) => s.setActiveSection);

  const [shown, setShown] = useState<SectionId | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (activeSection) {
      // Mount the section closed, then open it on the next frame.
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        setShown(activeSection);
        raf2 = requestAnimationFrame(() => setOpen(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }
    // Animate out, then unmount after the transition.
    const raf = requestAnimationFrame(() => setOpen(false));
    const t = setTimeout(() => setShown(null), 320);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [activeSection]);

  // Esc closes while a section is open.
  useEffect(() => {
    if (!activeSection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveSection(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSection, setActiveSection]);

  if (!shown) return null;

  const content = CONTENT[shown];
  const accent = ZONE_BY_ID[shown].color;

  // Every section opens dead-centre; Skills just gets a wider panel to fit the
  // "Core Skills" marquee.
  const isSkills = shown === "skills";
  const wrapClass =
    "pointer-events-none fixed inset-0 z-20 flex items-center justify-center p-4 sm:p-8";
  const closedClass = "translate-y-6 opacity-0";

  return (
    <>
      {/* Blurs the live 3D scene behind the panel while a section is open. It's
          pointer-events-none so a click still falls through to the canvas's
          onPointerMissed and closes the section. Fades with the panel via
          `open`; the Nav (z-30) and panel (z-20) stay above it, so only the
          city blurs. */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-10 bg-[#070b18]/30 backdrop-blur-md transition-opacity duration-300 ease-out ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className={wrapClass}>
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="overlay-title"
          // max-h + scroll: the panel is vertically centred, so a tall section
          // (Skills = marquee + certifications) would otherwise run off both
          // ends of a short viewport with no way to reach the bottom. The caps
          // are what a centred panel can be without growing up behind the fixed
          // Nav: the header measures 152px at 390px wide (it wraps to two rows)
          // and 82px from sm up, leaving 60vh / 78vh once both ends are cleared.
          className={`pointer-events-auto max-h-[60vh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/80 p-6 text-zinc-100 shadow-2xl backdrop-blur-md transition duration-300 ease-out sm:max-h-[78vh] sm:p-8 ${
            isSkills ? "max-w-5xl" : "max-w-md"
          } ${open ? "translate-y-0 opacity-100" : closedClass}`}
        >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p
              className="text-xs font-medium uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              {content.tagline}
            </p>
            <h2
              id="overlay-title"
              className="mt-1 text-2xl font-semibold tracking-tight"
            >
              {content.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveSection(null)}
            aria-label="Close section"
            className="rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <CloseIcon />
          </button>
        </div>

        {content.body && (
          <p className="text-sm leading-relaxed text-zinc-300">{content.body}</p>
        )}

        {shown === "skills" ? (
          <>
            <SkillsMarquee accent={accent} />
            <Certifications items={content.items} accent={accent} />
          </>
        ) : shown === "experience" ? (
          <Timeline items={content.items} accent={accent} />
        ) : (
          <ul className="mt-5 space-y-2">
            {content.items.map((item) => (
              <li
                key={item.label}
                className="rounded-lg border border-white/5 bg-white/5 px-4 py-3"
              >
                <span
                  className="block h-1 w-6 rounded-full"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                />
                {item.href ? (
                  <a
                    href={item.href}
                    {...externalLinkProps(item.href)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-zinc-100 transition-colors hover:text-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                    style={{ "--accent": accent } as React.CSSProperties}
                  >
                    {item.label}
                    <ArrowIcon />
                  </a>
                ) : (
                  <span className="mt-2 block text-sm font-medium text-zinc-100">
                    {item.label}
                  </span>
                )}
                {/* Projects carry a `stack`, so their supporting text splits
                    into two stacked mini boxes — tech on top, result below.
                    Everything else (Contact) keeps the plain detail line. */}
                {item.stack ? (
                  <div className="mt-2 space-y-1.5">
                    <span className="block rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-zinc-400">
                      {item.stack}
                    </span>
                    {item.detail && (
                      <span className="block rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-zinc-400">
                        {item.detail}
                      </span>
                    )}
                  </div>
                ) : (
                  item.detail && (
                    <span className="mt-0.5 block text-xs text-zinc-400">
                      {item.detail}
                    </span>
                  )
                )}
                {item.liveHref && (
                  <a
                    href={item.liveHref}
                    {...externalLinkProps(item.liveHref)}
                    className="mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.15em] text-zinc-300 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    style={
                      {
                        "--accent": accent,
                        borderColor: accent,
                      } as React.CSSProperties
                    }
                  >
                    Live site
                    <ArrowIcon />
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
        </section>
      </div>
    </>
  );
}

/**
 * Vertical timeline of roles (the Experience "map"), split into labelled
 * groups — Work, Education. Consecutive items sharing a `group` render under
 * one heading; items with no `group` fall into a single unlabelled run, so the
 * component still works for ungrouped data.
 */
function Timeline({
  items,
  accent,
}: {
  items: SectionItem[];
  accent: string;
}) {
  const groups: { name?: string; items: SectionItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.name === item.group) last.items.push(item);
    else groups.push({ name: item.group, items: [item] });
  }

  return (
    <div className="mt-5 space-y-5">
      {groups.map((group, i) => (
        <div key={group.name ?? `group-${i}`}>
          {group.name && (
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: accent }}
            >
              {group.name}
            </p>
          )}
          <ol className="space-y-5 border-l border-white/15 pl-5">
            {group.items.map((item) => (
              <li key={item.label} className="relative">
                <span
                  className="absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-zinc-900"
                  style={{ backgroundColor: accent }}
                  aria-hidden
                />
                <span className="block text-sm font-medium text-zinc-100">
                  {item.label}
                </span>
                {item.detail && (
                  <span className="mt-0.5 block text-xs text-zinc-400">
                    {item.detail}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

/**
 * Certifications grid shown under the Skills marquee. Widens to three columns
 * on lg so the five entries fill the `max-w-5xl` Skills panel (3 + 2) instead
 * of sitting in stretched half-width cards with an orphan trailing row.
 */
function Certifications({
  items,
  accent,
}: {
  items: SectionItem[];
  accent: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <p
        className="text-xs font-semibold uppercase tracking-[0.3em]"
        style={{ color: accent }}
      >
        Certifications
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li
            key={item.label}
            className="rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3"
          >
            <span className="block text-sm font-medium text-zinc-100">
              {item.label}
            </span>
            {item.detail && (
              <span className="mt-0.5 block text-xs text-zinc-400">
                {item.detail}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Open http(s) destinations in a new tab; leave `mailto:` (and anything else)
 * to the browser's default handling.
 */
function externalLinkProps(href: string) {
  return href.startsWith("http")
    ? ({ target: "_blank", rel: "noreferrer" } as const)
    : {};
}

/** Small outbound arrow shown beside links. */
function ArrowIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="block"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
