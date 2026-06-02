# CLAUDE.md — Working Guidelines for the 3D Portfolio

This is a personal portfolio: an interactive low-poly 3D island built with
**Next.js (App Router) + React Three Fiber**. Read `IMPLEMENTATION_PLAN.md`
in this folder for the architecture and build sequence before starting work.

## Golden rules (always)

1. **Research before you edit.** Understand the code and its context first.
2. **Before editing any file, read it first** — never edit blind.
3. **Before modifying a function, grep for all callers** and update them together.
4. **Prefer editing existing files over creating new ones.** Match the
   surrounding style, naming, and patterns.
5. **Verify before claiming done** — run `npm run dev` (or `npm run build`)
   and confirm the change actually works. Report failures honestly.
6. **Small, focused changes.** Don't refactor unrelated code in the same pass.
7. **Ask when genuinely blocked** by an ambiguous or irreversible decision;
   otherwise pick a sensible default and proceed.

## Tech stack — USE these

- **Next.js App Router** + **TypeScript** (no Pages Router).
- **React Three Fiber** (`@react-three/fiber`) — declarative components.
- **@react-three/drei** for helpers (`CameraControls`, `Environment`,
  `useGLTF`, `Html`, `Instances`, loaders).
- **zustand** for global state (the active section).
- **Tailwind CSS** for all DOM/overlay styling.
- **drei `CameraControls`** for smooth camera fly-to / return.
- Deploy on **Vercel** (Node runtime / Fluid Compute by default).

## Do NOT use / avoid

- **No imperative vanilla Three.js scene setup** (manual `new THREE.Scene()`,
  hand-rolled render loops) inside the R3F app — express 3D as components and
  use `useFrame` for per-frame logic.
- **Don't render section text as 3D text.** Section content is real HTML in
  DOM overlays (accessible, selectable, SEO-friendly).
- **No `any` in TypeScript.** Type props and store state properly.
- **Don't add heavy dependencies** without a clear reason — keep the bundle lean.
- **No Edge runtime** for functions; prefer Node/Fluid Compute (Edge has
  compatibility gaps on Vercel).
- **Don't commit secrets or `.env`**; never put secrets in client components.
- **Don't ship `leva`** dev controls to production — gate them behind dev only.
- **Don't reach for a build step / framework swap** (e.g. moving to Vite or
  vanilla) without asking — the stack is decided.

## Available plugins & skills

These are installed in this environment. Use the matching one when it fits;
don't reinvent what a skill already does.

**Most relevant to this project**
- `frontend-design` / `design-taste-frontend` — distinctive, non-generic UI.
- `feature-dev` — guided feature development with codebase understanding.
- `code-review` (and `/code-review`, `simplify`, `verify`, `run`) — review &
  validate changes.
- Vercel skills — `vercel:nextjs`, `vercel:shadcn`, `vercel:deploy`,
  `vercel:deployments-cicd`, `vercel:env` / `vercel:env-vars`,
  `vercel:vercel-cli`, `vercel:turbopack`, `vercel:performance-optimizer`,
  `vercel:react-best-practices`, `vercel:next-upgrade`, `vercel:next-cache-components`.

**Available but rarely needed here**
- Document skills: `anthropic-skills:docx` / `pdf` / `pptx` / `xlsx`.
- Backend/AI: `vercel:ai-sdk`, `vercel:ai-gateway`, `vercel:chat-sdk`,
  `vercel:workflow`, `vercel:vercel-functions`, `vercel:vercel-storage`,
  `vercel:auth`, `vercel:marketplace`, `vercel:vercel-firewall`,
  `vercel:vercel-sandbox`, `vercel:routing-middleware`, `vercel:runtime-cache`.
- Meta/tooling: `skill-creator`, `consolidate-memory`, `update-config`,
  `keybindings-help`, `deep-research`, `claude-api`, `init`, `schedule`, `loop`.

> Tip: `context7` MCP fetches up-to-date library docs (Three.js, R3F, drei,
> Next.js) — prefer it over memory when wiring unfamiliar APIs.

## Available subagents (plugin agents)

These specialized agents are installed. They are **opt-in only** — use one when
the user explicitly asks, or for a focused independent pass (e.g. a review after
a build). Don't spawn them for the normal sequential build; one agent handles
that more cheaply. Each starts cold, so give it full context.

- `feature-dev:code-architect` (sonnet) — design a feature's architecture from
  existing patterns; produces an implementation blueprint.
- `feature-dev:code-explorer` (sonnet) — deeply analyze/trace an existing
  feature or codebase area before changing it.
- `feature-dev:code-reviewer` (sonnet) — review changes for bugs, security, and
  convention issues. Good for an independent post-build pass.
- `vercel:ai-architect` (inherit) — architect AI-powered features (only if this
  project ever adds AI; not needed for the core 3D portfolio).
- `vercel:deployment-expert` (inherit) — Vercel deploy/CI-CD, preview URLs,
  rollbacks, env/domains. Useful at the deploy step (Step 7) — when asked.
- `vercel:performance-optimizer` (inherit) — Core Web Vitals, bundle size,
  rendering/caching. Useful for a later perf pass once the site works.

## Cautions on tools/skills (don't misuse)

- **Don't self-trigger billed/cloud reviews.** `/code-review ultra`
  (a.k.a. ultrareview) is user-initiated and billed — never launch it yourself.
- **Don't spawn subagents or run a `Workflow`** unless explicitly asked; they're
  expensive and start without this conversation's context. Handle tasks inline.
- **Don't auto-deploy.** Run `vercel deploy` / promote to production only when
  asked.
- **`leva`, postprocessing, audio, particles** are polish — add them only after
  the core interaction works, and keep them optional.
- **Stay on the agreed stack.** Don't introduce alternative state managers,
  styling systems, or 3D approaches without checking in first.
