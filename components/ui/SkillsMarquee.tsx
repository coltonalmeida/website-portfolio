"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SKILLS, type Skill } from "@/lib/skills";

/**
 * The Skills section's "Core Skills" strip: a horizontal row of skill cards
 * that auto-scrolls (a marquee that "goes around" by looping), **pauses on
 * hover** so you can read it, is **grabbable** — drag to scrub, fling to send
 * it racing before it eases back to its crawl — and can be **filtered with the
 * search box**. When a query is present the marquee stops and the matching
 * cards lay out statically.
 *
 * Motion is a rAF loop rather than a CSS animation because pointer velocity
 * has to feed straight into it; all of it lives in refs so a drag never
 * re-renders the card list.
 *
 * Real DOM (accessible / selectable), per the no-3D-text rule — the 3D scene
 * stays the backdrop while this is the actual Skills content.
 */

/** Resting speed, px/s. Negative = leftward, the conventional ticker direction. */
const BASE_VELOCITY = -70;
/** Time constants (s) for the exponential ease back to `target` velocity. */
const TAU_HOVER = 0.3;
const TAU_FLING = 0.45;
/** A fling can't exceed this, px/s — a flick on a trackpad reads very high. */
const MAX_FLING = 2500;
/** How much of each pointermove sample folds into the smoothed drag velocity. */
const VELOCITY_SMOOTHING = 0.2;

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

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  /** Current translate, px. Kept wrapped into (-period, 0]. */
  const offsetRef = useRef(0);
  const velocityRef = useRef(BASE_VELOCITY);
  /** Width of one full set of cards — the distance after which the loop repeats. */
  const periodRef = useRef(0);
  const hoverRef = useRef(false);
  const dragRef = useRef({ active: false, lastX: 0, lastT: 0, velocity: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // One set's width = where the duplicate set's first card starts. Measuring
  // `scrollWidth / 2` instead would come up half a gap short and the loop would
  // visibly stutter on each wrap.
  useLayoutEffect(() => {
    if (searching) return;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => {
      const first = track.children[0];
      const duplicate = track.children[SKILLS.length];
      if (!(first instanceof HTMLElement) || !(duplicate instanceof HTMLElement))
        return;
      periodRef.current = duplicate.offsetLeft - first.offsetLeft;
    };

    measure();
    // Card widths shift with the panel and with late-loading fonts.
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(track);
    return () => observer.disconnect();
  }, [searching]);

  useEffect(() => {
    if (searching) return;
    const track = trackRef.current;
    if (!track) return;

    // The crawl is always-on by design: a decorative, edge-masked strip that a
    // visitor pauses by hovering or grabbing it. It intentionally ignores
    // prefers-reduced-motion so it never sits dead.
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      // Clamp so a backgrounded tab doesn't resume with one giant jump.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const drag = dragRef.current;
      if (drag.active) {
        velocityRef.current = drag.velocity;
      } else {
        const target = hoverRef.current ? 0 : BASE_VELOCITY;
        // Coast down from a fling more slowly than we settle for a hover.
        const tau =
          Math.abs(velocityRef.current) > Math.abs(BASE_VELOCITY)
            ? TAU_FLING
            : TAU_HOVER;
        velocityRef.current +=
          (target - velocityRef.current) * (1 - Math.exp(-dt / tau));
        offsetRef.current += velocityRef.current * dt;
      }

      const period = periodRef.current;
      if (period > 0) {
        // Wrap into (-period, 0] — works for either drag direction.
        offsetRef.current = ((offsetRef.current % period) - period) % period;
      }
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [searching]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Let the search input and any future links keep their own pointer handling.
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      lastX: e.clientX,
      lastT: performance.now(),
      velocity: 0,
    };
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    const now = performance.now();
    const dx = e.clientX - drag.lastX;
    const dt = (now - drag.lastT) / 1000;
    offsetRef.current += dx; // 1:1 scrub — the strip tracks the finger exactly.
    if (dt > 0) {
      // Smoothed so one jittery final frame doesn't decide the whole fling.
      drag.velocity +=
        (dx / dt - drag.velocity) * VELOCITY_SMOOTHING;
    }
    drag.lastX = e.clientX;
    drag.lastT = now;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    // Release keeps your speed; the loop's easing walks it back to BASE.
    velocityRef.current = Math.max(-MAX_FLING, Math.min(MAX_FLING, drag.velocity));
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

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
          ref={viewportRef}
          data-skills-marquee
          // touch-action pan-y: a vertical swipe still scrolls the overlay
          // panel on mobile, horizontal drags belong to the marquee.
          className={`relative mt-4 touch-pan-y select-none overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerEnter={() => {
            hoverRef.current = true;
          }}
          onPointerLeave={() => {
            hoverRef.current = false;
          }}
        >
          {/* Two identical sets so wrapping by one set's width is seamless. */}
          <div
            ref={trackRef}
            data-skills-track
            className="flex w-max gap-3 will-change-transform"
          >
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
