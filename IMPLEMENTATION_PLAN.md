# Plan: Interactive 3D Portfolio (Low-Poly Toronto, Night)

> **THEME UPDATE (supersedes "island" wording throughout this doc):** the scene
> is now a **detailed, night-themed low-poly Toronto city** diorama. See the
> "Design theme — Toronto city" section in `CLAUDE.md` for the full direction.
> The interaction model (zones → camera fly-to → overlay) is unchanged; only the
> visual identity changes. Steps 1–5 were built with the old generic island —
> Step 6 below now re-skins them into Toronto-at-night.

## Context

Colton wants a standout personal portfolio built around an **interactive low-poly 3D Toronto city scene at night**. Instead of a traditional scrolling page, visitors explore a small 3D diorama where four landmark zones map to portfolio sections:

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
2. ✅ **Island + environment** — terrain geometry, flat-shaded materials, lights, fog, background, sensible default camera framing.
3. ✅ **Zones + picking** — add the four landmark components with `ZoneConfig` metadata; hover highlight + pointer cursor; `onClick` → store.
4. ✅ **Camera rig** — `CameraRig` with `CameraControls`; effect on `activeSection` flies to the zone target or returns home; lock orbit while focused.
5. ✅ **Overlay + content + nav** — `Overlay.tsx` bound to `content.ts`, open/close via store (button/Esc/empty-click); `Nav.tsx` fallback buttons; `Suspense` + `Loader`.
6. ✅ **Toronto night re-skin + polish** — re-theme the existing island into a
   **detailed Toronto city at night** (per `CLAUDE.md`): night sky (stars + moon),
   CN Tower centerpiece + Financial District towers, glowing/varied tower windows
   (emissive), lit CN Tower, street lamps, streetcar + headlight glow, Lake Ontario
   water plane catching city lights, plus density detail (varied buildings, rooftop
   props, trees, cars, docks/boats, signs). Re-map zones to Toronto landmarks
   (Experience→CN Tower, Projects→Financial District, Skills→streetcar/Distillery,
   Contact→waterfront). Then the standard polish: intro camera animation, touch/
   mobile handling, responsive overlay, no-WebGL fallback, strip `leva` from prod,
   optional postprocessing bloom on the emissive lights. **Take screenshots to
   `screenshots/` so Colton can review the look.**
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

- **Step 2 — Done.** Island + environment. `Environment.tsx` (`SceneEnvironment`):
  sky-blue background + fog, hemisphere + ambient fill, shadow-casting directional
  key light with a tightened ortho shadow frustum. `Island.tsx`: flat-shaded
  primitive island (water plane, rocky underwater taper, sand shoreline, grass
  plateau, a hill, six deterministic pines) plus a `useGLTF` seam (`modelUrl` prop)
  and exported `GRASS_TOP`/`SAND_TOP` surface heights. `Scene.tsx` assembles
  Environment + Island; `Experience.tsx` frames the camera ([13,9,13], fov 45) with
  `OrbitControls` clamped (no pan, polar/distance limits, target [0,1.4,0]).
  `npm run build` clean; dev server returns `GET / 200` with no runtime errors.
  Note: R3F v9 dropped `GroupProps` — element prop types come from
  `ThreeElements["group"]` now.

- **Step 3 — Done.** Zones + picking. `types/index.ts` (`SectionId`, `CameraTarget`,
  `ZoneConfig`); `lib/store.ts` (zustand: `activeSection` + `hoveredSection` and
  setters); `lib/zones.ts` (`ZONES` — four landmarks at the cardinal plateau edges
  with accent colors and per-zone `cameraTarget`). `components/canvas/Zone.tsx`:
  outer group fixed at the zone position owns pointer events; an inner group
  animates a hover/active lift + scale via `MathUtils.damp` in `useFrame` (mutated
  by ref, not props); hover sets pointer cursor + `hoveredSection`; click sets the
  active section. Four distinct low-poly clusters (workbench, building cluster,
  stacked platforms+flag, lighthouse) with an emissive accent that glows on
  hover/active. `Scene.tsx` renders the zones; clicking the island ground or
  empty space (`Canvas onPointerMissed`) deselects. Build clean.

- **Step 4 — Done.** Camera rig. `components/canvas/CameraRig.tsx` uses drei
  `CameraControls` (`makeDefault`, ref typed via `ComponentRef<typeof
  CameraControls>`). An effect on `activeSection` calls `setLookAt(...camPos,
  ...lookAt, true)` — flies to the focused zone's `cameraTarget`, or back to the
  exported `HOME` framing on deselect. Orbiting locks while focused
  (`enabled={activeSection === null}`); distance/polar limits preserved;
  `smoothTime={0.5}` for a cinematic glide. `Experience.tsx` now renders
  `<CameraRig />` instead of `OrbitControls` and seeds the Canvas camera from
  `HOME.position`. Build clean; dev serves 200 with no runtime errors. (Camera
  motion itself is best confirmed visually in Step 6's polish/QA pass.)

- **Step 5 — Done.** Overlay + content + nav. `lib/content.ts` (`CONTENT:
  Record<SectionId, { title; tagline; body; items[] }>` placeholders — swap point
  for real copy). `lib/zones.ts` gained `ZONE_BY_ID` for accent/label lookup.
  `components/ui/Overlay.tsx`: accent-themed DOM panel bound to `activeSection`,
  enter slide+fade, close button + Esc; renders directly off the store (all
  setState inside rAF to satisfy `react-hooks/set-state-in-effect`).
  `components/ui/Nav.tsx`: header (name + hint) + four real `<button>`s
  (`aria-pressed`, toggle active, hover/focus → `hoveredSection`) — the
  keyboard/no-WebGL fallback. `Zone.tsx` now also lifts when its section is
  hovered in the nav. `components/ui/Loader.tsx`: drei `useProgress` preloader
  (seam for GLB/textures). `Scene` wrapped in `<Suspense>`; `app/page.tsx` mounts
  Nav/Overlay/Loader as DOM siblings of the Canvas. Build + lint clean; dev serves
  200 and SSRs the nav (accessible fallback present without WebGL).

- **Step 6 — Done.** Toronto-at-night re-skin + polish.
  - **Environment.tsx:** deep navy sky + fog, cool low ambient/hemisphere,
    shadow-casting moonlight, an emissive moon disc + halo, and drei `Stars`.
  - **Island.tsx:** city concrete platform + waterfront lip, streets with
    emissive lane dashes, and a reflective **Lake Ontario** (`MeshReflectorMaterial`)
    that catches the city lights. Exports `GROUND_Y` / `LAKE_Y`.
  - **Building.tsx + lib/windowTexture.ts:** flat-shaded towers with procedural
    emissive "lit windows" (seeded canvas textures), roof caps, and rooftop props
    (water towers / antennas with red aviation lights).
  - **CNTower.tsx:** iconic CN Tower (tapered hex shaft, flared SkyPod, antenna)
    with hue-cycling accent lights (per-material refs animated in `useFrame`) and
    a blinking aviation tip.
  - **City.tsx:** ambient skyline buildings, street lamps (warm point lights),
    parked cars (head/tail lights), trees, and a glowing billboard — all
    deterministic.
  - **Zone.tsx / lib/zones.ts:** zones re-mapped — Experience = CN Tower,
    Projects = Financial District cluster, Skills = TTC streetcar + workshop,
    Contact = waterfront dock (mailbox, moored boat, dock lamp). New positions,
    accent colors, and night camera framings.
  - **Experience.tsx:** `EffectComposer` **Bloom** (the night glow) + Vignette;
    plus a **no-WebGL fallback** (the menu still serves all content).
  - **CameraRig.tsx:** intro fly-in (snap high over the lake → glide to HOME);
    HOME reframed into the skyline.
  - **Overlay.tsx:** graceful **exit** animation (retains the last section through
    the out-transition; all setState in rAF/timeout to stay lint-clean).
  - Copy retheme (taglines, nav/loader). `tsc` + `npm run lint` + `npm run build`
    all clean. Lint note: the React-Compiler rule set forbids reading/mutating
    refs during render and mutating hook-arg values — animate via per-element
    material refs in `useFrame` (see CNTower), not shared memoized materials.
  - **Screenshots in `screenshots/`** (captured via Playwright headless Chromium —
    `scripts/screenshots.mjs`, dev-only dep): `desktop-01-default` … `-05-contact`
    (default + each zone with overlay) and `mobile-01-default`, `mobile-02-projects`
    (bottom-sheet overlay).

**Step 6 complete — the night-Toronto scene is live and polished.** Dev server is
left running at http://localhost:3000 for review.

- **Step 6b — Done (review rework).** Bigger map + new landmarks + world fixes:
  - **Sky/sea:** `Environment` gained a gradient **sky dome** (zenith→horizon
    glow) and a visible **custom starfield** (the old drei `<Stars>` were washed
    out by fog); fog retuned so **Lake Ontario blends into the horizon** instead
    of ending abruptly (enlarged reflector).
  - **Map/roads:** `Island` platform enlarged to 36×25 with a proper **street
    grid** — sidewalks, lane dashes, **crosswalks**.
  - **CN Tower:** taller, more iconic proportions; now an **ambient centerpiece**
    rendered from `City` at `TOWER_POSITION`.
  - **Landmarks re-mapped:** Experience → **Union Station + GO train**
    (`UnionStation.tsx`), and its overlay now renders a **roles timeline**;
    Projects → **building under construction** (`Construction.tsx` — crane,
    scaffolding, netting, work lights); Skills → **scrolling LED ticker** wrapped
    on the CN Tower (`SkillsTicker.tsx` + `lib/tickerTexture.ts`, `noLift` zone);
    Contact → **ferry dock** with a moored Toronto Island ferry
    (`WaterfrontDock.tsx`).
  - **Wiring:** `lib/zones.ts` remapped (+`TOWER_POSITION`, `noLift` on
    `ZoneConfig`); `City` spreads ambient buildings + streetcar + props across the
    bigger grid; `CameraRig` HOME/intro reframed (maxDistance 60); content
    taglines updated. `tsc` + lint + production build clean; screenshots refreshed
    (note: the marquee/ticker text is decorative — the accessible Skills content
    still lives in the DOM overlay, per the no-3D-text rule).

- **Step 6c — Done (lighting & realism polish pass).** Worked the full
  improvement brief (lighting → windows → landmarks → roofs → props → camera):
  - **Lighting/atmosphere (`Environment`, `Experience`):** lifted + warmed the
    ambient/hemisphere floor so mid-distance streets/facades read instead of
    crushing to black; swapped linear fog for tuned `fogExp2`; added a large
    fogged **ground/water skirt** so the platform no longer floats over a void on
    its dark sides. Retuned **Bloom** (intensity 0.9→0.62, threshold 0.2→0.26,
    radius 0.7→0.55) so the city glows cohesively without clipping, and added an
    **SMAA** pass.
  - **Clamped the blowouts:** the stadium GLB darkened (×0.5) with restrained
    point lights + a warm interior-bowl glow so it reads as a **dome** (Rogers
    Centre/SkyDome), not a white disc; CN Tower / construction work-light / dock
    lamp intensities all pulled back.
  - **Windows (`lib/windowTexture.ts`, `Building`):** per-building **colour
    temperature** (warm vs cool clusters, no scattered cyan), **clustered dark
    floors/columns** + lower lit ratio, per-window **brightness variation**, and a
    recessed **bezel**; fixed aliasing (LinearFilter + mipmaps + anisotropy 16,
    bigger cells), softened emissive, per-building intensity spread.
  - **Roofs/landmarks (`Building`, `City`):** rooftop **HVAC** boxes on every
    tower; **3 unique "hero" towers** (taller, tinted, lit crown band + antenna)
    in the financial core to break the repeated-box skyline.
  - **Props/composition (`City`, `BillboardModel`, `CameraRig`):** replaced the
    placeholder **lorem-ipsum billboard** with a lit **"TORONTO" neon sign +
    maple leaf**; added a waterfront **park** (denser trees + benches) and small
    green **light pools** at the traffic signals to fill the dead foreground;
    lowered the HOME camera. `tsc` + lint + `npm run build` all clean.
  - **Screenshots refreshed** in `screenshots/` (desktop default + 4 zones,
    mobile default + projects). Note: `scripts/screenshots.mjs` got a longer
    per-shot timeout + per-shot try/catch — the heavier zoomed frames (now with
    the SMAA pass) render slowly under software WebGL/SwiftShader but are fine on
    a real GPU.

- **Step 6d — Done (scene review tweaks).** Worked Colton's six-item punch list:
  1. **Removed the TTC streetcar + its tram tracks** from the main avenue
     (`City` — deleted the `Streetcar`/`StreetcarTrack` render + defs).
  2. **Proper heavy-rail track under the GO train** (`UnionStation` — new
     `TrainTrack`: ballast bed, wooden sleepers, two steel rails) replacing the
     old flat painted strip.
  3. **Made the sign proper** — new `TorontoSign.tsx`: the iconic Nathan Phillips
     Square multicolour **3D "TORONTO" letters** (extruded box strokes, only T/O/R/N
     are unique glyphs) on a lit plinth, replacing the old canvas-texture
     billboard (`BillboardModel.tsx` deleted).
  4. **Skills landmark is now the TORONTO sign** (was the invisible CN-Tower
     ticker region). `Zone` renders `TorontoSign`; `lib/zones.ts` skills zone moved
     to the plaza south of the tower `[-1,0,-0.3]` with a new camera framing and no
     more `noLift`; `SkillsTicker.tsx` + `lib/tickerTexture.ts` deleted. CN Tower
     stays as the ambient centerpiece. Overlay tagline → "Nathan Phillips Square".
  5. **More buildings** — added deep-north skyline backdrop + NW/NE clusters and
     extra midtown/waterfront fillers in `lib/cityGrid.ts` `DISTRICTS`; reserved the
     sign plaza so ambient towers stay clear of it.
  6. **More street props** (`City`) — fire hydrants, trash cans, planters,
     bollards lining the plaza, newspaper boxes, a glass TTC **bus shelter**, and a
     **hot dog cart**, all hand-placed on sidewalks clear of roads/landmarks.
  `tsc` + `npm run lint` + `npm run build` all clean; **screenshots refreshed** in
  `screenshots/` (desktop default + 4 zones, mobile default + projects).

- **Step 6e — Done (sign revert + GLB signals/streetlights + 4-way crossings).**
  Second review pass from Colton:
  1. **Reverted the Skills sign to the old billboard look** — restored
     `BillboardModel.tsx` (canvas neon "TORONTO" panel on posts) as a
     `glow`-driven landmark (the wrapping `Zone` owns pointer/lift), deleted the
     3D-letter `TorontoSign.tsx`, repointed the `skills` zone case, and tightened
     the skills `cameraTarget`. CN Tower stays ambient.
  2. **Crosswalks on all four sides** — `lib/cityGrid.ts` `CROSSWALKS` now emits
     the east + south legs as well as west + north, so every intersection has a
     full set (`Island.tsx` renders them unchanged, data-driven).
  3. **Real GLB traffic signals, one-way** — new `TrafficSignal.tsx` isolates the
     `Traffic Signal_67` mast-arm subtree from `public/models/traffic-signal.glb`
     (Sketchfab "Traffic Lights (animation) – free"; the file ships **no baked
     animation**, so the cycle is driven in `useFrame`). Lenses are matched by
     source material name (`Material.003/004/005` = red/amber/green), tagged on
     `material.userData.role`, and animated through the rendered object's ref
     (mutating a `useMemo` result trips the React-Compiler immutability rule —
     reach materials via a JSX ref instead, like `CNTower`). `lib/cityGrid.ts`
     gained one-way `oneway` dirs on every `RoadSeg`, an `INTERSECTIONS` list, and
     a derived `SIGNALS` list that places one mast-arm per one-way approach at the
     two front avenues' intersections, facing oncoming traffic, with avenue/street
     phases opposed. Replaced the old `road-traffic-pack` `TrafficLight.tsx`
     (deleted).
  4. **GLB street lamps, mid-block** — new `StreetLight.tsx` isolates a chosen
     `Farola…` variant from `public/models/street-lights.glb` (Sketchfab low-poly
     street-lights pack), auto-scales every variant to a common height, and glows
     the `white_emiting` head. `City.tsx` replaced the procedural `Lamp`/`LAMPS`
     with a deterministic **mix** of variants placed along every road's curbs,
     skipping intersections (those get signals) and the landmark plazas; a subset
     cast real point lights to keep the light count sane.
  `tsc` + lint + `npm run build` all clean. Verified via Playwright screenshots
  (incl. throwaway camera-controls hook for intersection close-ups, since removed):
  billboard restored, 4-leg crossings, mast-arm signals spanning the roads with
  lit cycling lenses, and GLB lamps lining the mid-blocks. Two new GLBs copied
  into `public/models/` (`street-lights.glb`, `traffic-signal.glb`); both are
  Sketchfab CC-BY exports — attribution noted in each component (no licence file
  shipped). Note: `road-traffic-pack.glb` is now unused but left in `public/models`.

- **Step 6f — Done (fix leaked street models + lamp/light/billboard polish).**
  - **Root-cause fix (the "weird road models"):** `TrafficSignal` looked the GLB
    node up as `"Traffic Signal_67"`, but Three's GLTFLoader sanitizes names
    (spaces → `_`), so the real name is `Traffic_Signal_67`. The lookup failed and
    the old `signal ?? clone` fallback kept the **entire** GLB — a full modular
    street scene — drawing road/sidewalk pieces at all 8 signal spots. Fixed to use
    the sanitized name, a `/signal/i` traversal fallback, and **never** the whole
    scene (returns an empty group if not found). This also corrects signal
    scale/placement (bbox was being measured off the whole street). `StreetLight`
    got the same defensive guard.
  - **Lamps:** `StreetLight` `TARGET_H` 3.2 → 2.2 (shorter); `City` `STREET_LIGHTS`
    now skips any lamp whose footprint overlaps a `BUILDINGS`/`HEROES` box
    (`insideBuilding`), so lamps no longer clip through buildings.
  - **Construction:** removed the unsupported floating "work light" emissive box;
    its point light is grounded by the shipping container instead.
  - **Skills billboard:** wordmark `TORONTO` → **`SKILLS`**, tagline →
    `WHAT'S IN MY TOOLKIT` (canvas widened to 1024px); panel widened
    (`SCREEN_W` 3.4 → 4.6); `lib/zones.ts` skills camera pulled back to frame it.
  - Crosswalks were already correct 4-sided primitives (no change). `tsc` + lint +
    build clean; screenshots refreshed — intersection close-ups confirm clean
    primitive roads with full 4-leg crossings and the isolated mast-arm signal, no
    stray street geometry.

- **Step 6g — Done (dash bleed + on-road props).**
  - **Centre-line dashes no longer bleed into crossings:** `Island.tsx` `Road`
    widened the dash-suppression margin from `c.half + 0.4` to `c.half + 1.1` so
    yellow dashes stop short of every intersection and its crosswalk (the crosswalk
    sits at `c.half + 0.7` set-back + ~0.25 bar). Dashes still run normally along
    open road.
  - **Street furniture off the road** (`City.tsx`): the security `BOLLARDS` (were a
    row on the waterfront avenue under the Skills sign) now line the **Union Station
    forecourt** (`z=-0.8`, `x` −23…−15, off every road); the hydrant `{9,3.9}` and
    trash `{11,3.9}` that sat on the east street (x=10) moved to `x=6.5` / `x=13.5`
    on the sidewalk; the two sign-flanking planters moved off the avenue edge
    (`z 0.4 → -0.5`).
  - `tsc` + lint + build clean; screenshots refreshed — intersection close-ups
    confirm no dash enters a crosswalk and no prop sits on a road.

- **Step 6h — Done (remove station-front tree + shrink Skills billboard).**
  - Removed the `TREES` entry `{x:-11,z:6.4}` (`City.tsx`) — the conifer beside the
    west waterfront crosswalk in front of Union Station; other trees kept.
  - Shrank the Skills billboard (`BillboardModel.tsx`): `SCREEN_W` 4.6→3.7,
    `SCREEN_H` 2.0→1.6, `SCREEN_Y` 2.6→2.1 (keeps the wider aspect + crisp canvas);
    reframed the `skills` `cameraTarget` (`lib/zones.ts`) closer/lower.
  - `tsc` + lint + build clean; screenshots refreshed and matched against the
    user's references to confirm the right tree was removed.

**RESUME HERE → Step 7 (Deploy), when ready:** write a short `README.md` (what it
is, stack, `npm run dev` / `npm run build`, the `useGLTF` + `lib/content.ts` swap
points, how to regenerate screenshots), do a final `npm run build`, then deploy to
Vercel — **only when Colton explicitly asks** (do not auto-deploy). Optional future
polish: tune lake reflection strength, add a raccoon easter-egg / "TORONTO" sign,
gentle idle auto-orbit, audio toggle. Real content still swaps into
`lib/content.ts`; real `.glb` models via the `Island`/`useGLTF` seam.
