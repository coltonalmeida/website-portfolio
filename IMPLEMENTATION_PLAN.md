# Plan: Interactive 3D Portfolio (Low-Poly Island)

## Context

Colton wants a standout personal portfolio built around an **interactive low-poly 3D island/world**. Instead of a traditional scrolling page, visitors explore a small 3D diorama where four landmark zones map to portfolio sections:

- **Skills**
- **Projects**
- **Experience**
- **Contact**

Clicking a landmark flies the camera to it and opens a content panel. The goal is a memorable, game-like first impression that still presents content clearly and remains accessible.

**Decisions locked in (from planning Q&A):**
- Centerpiece: **low-poly island/world**
- Stack: **Next.js (App Router) + React Three Fiber** — Three.js core, expressed declaratively as React components (user was open on framework; this is the recommended path)
- 3D asset: **undecided** → build the island from code/primitives now, keep a `useGLTF` loader path ready to swap in a real `.glb` later
- Content: **placeholders** now, real content swapped in later
- Language: **TypeScript**

This is a greenfield, empty directory — no existing code to reuse.

---

## Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | SSR/SEO, routing, easy Vercel deploy |
| 3D | **three + @react-three/fiber** | Declarative Three.js in React — clean state/UI integration |
| 3D helpers | **@react-three/drei** | `OrbitControls`/`CameraControls`, `Environment`, `useGLTF`, `Html`, `Instances`, loaders |
| Camera transitions | **drei `CameraControls`** (`camera-controls`) | Built-in smooth `setLookAt` fly-to / return |
| State | **zustand** | Tiny global store for the active section — drives camera + overlay |
| Styling | **Tailwind CSS** | Fast, consistent overlay/UI styling |
| Dev tuning (optional) | **leva** | Tweak lights/positions live; not shipped to prod |
| Deploy | **Vercel** | First-class Next.js hosting |

> Section content lives in **DOM overlays** (real HTML via React), not 3D text — accessible, selectable, SEO-friendly, and far simpler than in-scene typography.

---

## Architecture

Component-based R3F. The Canvas renders the world; a zustand store is the single source of truth for which section is active, and both the camera rig and the DOM overlay react to it.

```
portfolio-website/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # <Experience /> (canvas) + <Overlay /> + <Nav />
│   └── globals.css              # Tailwind + base styles
├── components/
│   ├── canvas/
│   │   ├── Experience.tsx       # <Canvas> wrapper (dpr, camera, Suspense)
│   │   ├── Scene.tsx            # assembles environment + island + zones + rig
│   │   ├── Island.tsx           # terrain (primitives now; useGLTF-ready)
│   │   ├── Zone.tsx             # one clickable landmark: hover/active + onClick
│   │   ├── Environment.tsx      # lights, fog, sky/background
│   │   └── CameraRig.tsx        # CameraControls; flies to active section / home
│   └── ui/
│       ├── Overlay.tsx          # DOM panel for the active section's content
│       ├── Nav.tsx              # 2D fallback + a11y section buttons
│       └── Loader.tsx           # Suspense/progress preloader (drei useProgress)
├── lib/
│   ├── store.ts                 # zustand: activeSection, setActiveSection
│   └── content.ts               # placeholder content per section
├── types/index.ts               # SectionId, ZoneConfig (mesh + cameraTarget)
├── public/models/               # optional real .glb later
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**Key contracts:**
- `SectionId = 'skills' | 'projects' | 'experience' | 'contact'`
- `lib/store.ts`: `{ activeSection: SectionId | null; setActiveSection(id|null) }`
- `ZoneConfig`: `{ id: SectionId; position; cameraTarget: { position; lookAt } }` — drives both the landmark placement and the camera fly-to.
- `lib/content.ts` exports `Record<SectionId, { title; body; items[] }>` placeholders (the swap point for real content).

---

## Interaction Flow

1. **Idle:** `CameraControls`/orbit lets the visitor slowly orbit the island (polar angle clamped; optional gentle auto-rotate).
2. **Hover:** each `Zone` handles `onPointerOver/Out` → lifts/scales or emissive glow + sets cursor to pointer.
3. **Select (click/tap):** `Zone.onClick` → `setActiveSection(id)`. `CameraRig` reacts via effect → `controls.setLookAt(...)` smoothly flies to that zone's `cameraTarget`; `Overlay` opens with that section's content.
4. **Close (button / Esc / click empty space):** `setActiveSection(null)` → camera returns home; overlay hides.
5. **Fallback nav:** `Nav.tsx` renders real `<button>`s for the four sections (keyboard/screen-reader usable, and works without WebGL), calling the same `setActiveSection`.

---

## The Island & Zones (primitives first, GLB-ready)

`Island.tsx` builds a stylized low-poly base (beveled disc or displaced plane) with **flat shading** for the faceted look. `Environment.tsx` adds hemisphere + directional light (optional soft shadows), light fog, and a flat sky/background.

Four themed `Zone`s placed around the island, each a `<group>` of cheap primitives + props (swappable for a loaded GLB without touching interaction wiring):
- **Skills** → workbench / tools or skill posts
- **Projects** → cluster of small buildings / monitors
- **Experience** → path up a hill / layered platforms (a "journey")
- **Contact** → lighthouse or mailbox

The GLB seam: `Island`/`Zone` accept an optional model URL and use drei `useGLTF` (with `useGLTF.preload`) when a real asset is dropped into `public/models/`.

---

## Build Sequence

0. ✅ **Write this plan into the repo** — save this document as `IMPLEMENTATION_PLAN.md` in the project root so the Claude Code CLI (or any future session) can read it and resume/act on the work. It is the living spec; check off steps as they land.
1. ✅ **Scaffold & baseline render** — `create-next-app` (TS, Tailwind, App Router); add `three @react-three/fiber @react-three/drei zustand` (+ dev `leva @types/three`). Render a `<Canvas>` with a single mesh + `OrbitControls`, `dpr={[1,2]}`, to confirm 3D works.
2. **Island + environment** — terrain geometry, flat-shaded materials, lights, fog, background, sensible default camera framing.
3. **Zones + picking** — add the four landmark components with `ZoneConfig` metadata; hover highlight + pointer cursor; `onClick` → store.
4. **Camera rig** — `CameraRig` with `CameraControls`; effect on `activeSection` flies to the zone target or returns home; lock orbit while focused.
5. **Overlay + content + nav** — `Overlay.tsx` bound to `content.ts`, open/close via store (button/Esc/empty-click); `Nav.tsx` fallback buttons; `Suspense` + `Loader`.
6. **Polish** — intro camera animation, touch/mobile handling, responsive overlay, no-WebGL fallback, strip `leva` from prod, optional postprocessing bloom.
7. **Deploy** — `npm run build` clean (no type errors), verify locally, then deploy to Vercel; add a short `README.md`.

---

## Critical Files To Create

- `lib/store.ts` — the single source of truth tying camera + overlay together
- `components/canvas/Zone.tsx` + `components/canvas/CameraRig.tsx` — the reusable clickable-landmark + fly-to system (heart of the interaction)
- `components/canvas/Scene.tsx` + `Island.tsx` — world assembly + terrain (GLB swap point)
- `components/ui/Overlay.tsx` + `lib/content.ts` — content presentation (real-content swap point)

---

## Verification

- **Dev:** `npm run dev` → open `http://localhost:3000`. Confirm the island renders, orbit works, all four landmarks highlight on hover, clicking each flies the camera in and opens the correct section panel, and close returns home. Drive this with the Preview MCP tools (screenshot + click) to confirm transitions visually.
- **Accessibility/fallback:** tab to `Nav` buttons and activate a section via keyboard; confirm the overlay opens; confirm a graceful message if WebGL is unavailable.
- **Responsive/touch:** resize to mobile widths; confirm tap-to-focus and overlay layout hold.
- **Prod build:** `npm run build` succeeds with no type errors; verify `npm start`/preview matches dev. Deploy to Vercel.

---

## Open / Deferrable

- Real `.glb` island/landmark models replace primitives later via the `useGLTF` seam — no interaction rewiring.
- Real portfolio copy/projects/links swap into `lib/content.ts`.
- Optional niceties (audio toggle, postprocessing bloom, particles) deferred to a polish pass.

---

## Progress Log

Stack as built: Next.js **16.2.7** (App Router, Turbopack), React **19.2.4**,
TypeScript, Tailwind **v4**. 3D deps: `three@0.184`, `@react-three/fiber@9`,
`@react-three/drei@10`, `zustand@5`. Dev: `@types/three`. `leva` deferred to
Step 6 (polish) to avoid React 19 peer-dep friction — it's optional anyway.
Layout note: scaffolded into `scaffold-tmp/` then moved to root (root was
non-empty, so `create-next-app` couldn't target it directly); root `CLAUDE.md`
preserved, scaffold's generated `CLAUDE.md`/`AGENTS.md` discarded.

- **Step 0 — Done.** Plan committed; git repo initialized.
- **Step 1 — Done.** Scaffold + baseline render. `components/canvas/Experience.tsx`
  renders a `<Canvas dpr={[1,2]} shadows>` with a flat-shaded spinning box,
  ambient + directional light, and `OrbitControls` (damping, `makeDefault`).
  `app/page.tsx` mounts it full-screen; `globals.css` locks the viewport
  (height 100%, no scroll). `npm run build` is clean.

**RESUME HERE → Step 2 (Island + environment):** create
`components/canvas/Scene.tsx` (world assembly), `components/canvas/Island.tsx`
(low-poly flat-shaded terrain — beveled disc / displaced plane, `useGLTF`-ready
seam), and `components/canvas/Environment.tsx` (hemisphere + directional light,
light fog, flat sky/background). Wire `Scene` into `Experience.tsx` replacing the
placeholder `SpinningBox`, and set a sensible default camera framing. Keep
`OrbitControls` for now (swapped for `CameraRig` in Step 4).
