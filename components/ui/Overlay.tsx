"use client";

import { useEffect, useRef, useState } from "react";
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
          className={`overlay-scroll pointer-events-auto max-h-[60vh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/80 p-6 text-zinc-100 shadow-2xl backdrop-blur-md transition duration-300 ease-out sm:max-h-[78vh] sm:p-8 ${
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
        ) : shown === "projects" ? (
          <ProjectList items={content.items} accent={accent} />
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
                {/* Contact is the only section left on this generic list, so a
                    plain detail line is all it needs — the stack/result boxes
                    and the live-site pill live in <ProjectList />. */}
                {item.detail && (
                  <span className="mt-0.5 block text-xs text-zinc-400">
                    {item.detail}
                  </span>
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
 * The Projects list. Split out from the generic item list because it's the one
 * section that outgrows the panel: every card carries a stack box, a result box
 * and sometimes an award pill. It gets its own capped scroll area so the panel
 * header — title and close button — stays pinned above it.
 *
 * The top/bottom fades follow the scroll position rather than a permanent
 * `mask-image` (the trick <SkillsMarquee /> uses): that strip loops forever, so
 * a fixed mask always reads right, whereas a finite list would sit at rest with
 * its first card veiled for no reason.
 */
function ProjectList({
  items,
  accent,
}: {
  items: SectionItem[];
  accent: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);

  // A ResizeObserver rather than a measure-on-mount call: it fires once on
  // observe (covering the initial layout without a synchronous setState in the
  // effect) and again whenever the panel or the cards reflow — e.g. text
  // rewrapping at a narrower width, which changes whether the list overflows
  // at all. The inner <ul> is observed too since that is what actually grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setAtTop(scrollTop <= 1);
      setAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, []);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setAtTop(scrollTop <= 1);
    setAtBottom(scrollTop + clientHeight >= scrollHeight - 1);
  };

  return (
    <div className="relative mt-5">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        // tabIndex so the region is keyboard-scrollable on its own, and
        // overscroll-contain so bottoming out doesn't chain the scroll up into
        // the panel's own overflow-y-auto.
        tabIndex={0}
        role="group"
        aria-label="Projects"
        className="overlay-scroll max-h-[32vh] overflow-y-auto overscroll-contain pr-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:max-h-[46vh]"
      >
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.label}
              className="rounded-lg border border-white/5 bg-white/5 px-4 py-3"
            >
              <span
                className="block h-1 w-6 rounded-full"
                style={{ backgroundColor: accent }}
                aria-hidden
              />
              {item.award && (
                <span className="mt-2 block">
                  <span
                    className="inline-block rounded-full border px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.15em]"
                    style={{ color: accent, borderColor: accent }}
                  >
                    {item.award}
                  </span>
                </span>
              )}
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
              {/* Supporting text splits into two stacked mini boxes — tech on
                  top, result below. */}
              <div className="mt-2 space-y-1.5">
                {item.stack && (
                  <span className="block rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-zinc-400">
                    {item.stack}
                  </span>
                )}
                {item.detail && (
                  <span className="block rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-zinc-400">
                    {item.detail}
                  </span>
                )}
              </div>
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
      </div>
      {/* An arbitrary linear-gradient rather than the gradient utilities:
          zinc-900 (#18181b) is the panel's own colour, so the fades read as the
          panel eating the list rather than a grey band laid over it. */}
      <div
        aria-hidden
        className={`pointer-events-none absolute left-0 right-2.5 top-0 h-6 bg-[linear-gradient(to_bottom,#18181b,transparent)] transition-opacity duration-200 ${
          atTop ? "opacity-0" : "opacity-100"
        }`}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute bottom-0 left-0 right-2.5 h-6 bg-[linear-gradient(to_top,#18181b,transparent)] transition-opacity duration-200 ${
          atBottom ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
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
