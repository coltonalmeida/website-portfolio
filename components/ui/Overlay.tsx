"use client";

import { useEffect, useState } from "react";
import type { SectionId } from "@/types";
import { usePortfolio } from "@/lib/store";
import { CONTENT, type SectionItem } from "@/lib/content";
import { ZONE_BY_ID } from "@/lib/zones";

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

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex items-end justify-center p-4 sm:items-center sm:justify-end sm:p-8">
      <section
        role="dialog"
        aria-modal="false"
        aria-labelledby="overlay-title"
        className={`pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/80 p-6 text-zinc-100 shadow-2xl backdrop-blur-md transition duration-300 ease-out sm:p-8 ${
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0 sm:translate-y-0 sm:translate-x-8"
        }`}
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

        <p className="text-sm leading-relaxed text-zinc-300">{content.body}</p>

        {shown === "experience" ? (
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
                <span className="mt-2 block text-sm font-medium text-zinc-100">
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
        )}
      </section>
    </div>
  );
}

/** Vertical timeline of roles (the Experience "map"). */
function Timeline({
  items,
  accent,
}: {
  items: SectionItem[];
  accent: string;
}) {
  return (
    <ol className="mt-5 space-y-5 border-l border-white/15 pl-5">
      {items.map((item) => (
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
