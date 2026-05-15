# Code Visualizer — Project Plan

> **The last code visualizer you ever need.** Drop any code project → see its dependencies
> as an interactive 3D/2D graph with architectural health insights.

---

## Vision

A language-agnostic code dependency visualizer. Drop a folder, get an explorable graph:
- **3D mode** — celestial globe with floating nodes, zoom-dependent transition to 2D
- **2D mode** — D3.js force simulation for detailed analysis
- **3 layouts** — force-directed, spherical/globe, concentric rings (user-selectable)
- **7 health checks** — circular deps, god classes, deep inheritance, DIP violations,
  hub/spoke coupling, low cohesion, type coverage
- **Search & tracing** — real-time search, two-point connection tracing with path animation
- **"Cagey" privacy** — private members shown with cage/haze visual
- **Language-agnostic** — plugin parser architecture, auto-detect from extension/content

Full design spec: `specs/architecture.md` (19 resolved design decisions)

---

## Architecture

```
User drops a folder
  → Browser reads files via File System Access API
  → Sends file paths/contents to Node.js backend (port 3001)
  → Backend detects language, routes to parser plugin
  → Parser returns graph JSON (nodes + edges + metadata)
  → Frontend renders via R3F (3D) or D3.js (2D)
```

| Layer | Tech |
|-------|------|
| Frontend | Vite + React 18 + TypeScript + FSD |
| 3D Rendering | react-three-fiber (R3F), drei |
| 2D Rendering | D3.js force simulation |
| Backend | Node.js + Express + TypeScript |
| Parsers | Plugin architecture (TS compiler API, Python AST, etc.) |
| Monorepo | npm workspaces (`client/`, `server/`) |

---

## Workflow

### Branch-per-theme

Each major phase gets its own branch off `develop`. Work happens on the phase branch,
merged back when complete. This keeps `develop` as the integration point while allowing
parallel theme branches.

| Branch | Phase | Status |
|--------|-------|--------|
| `feature/phase-1-scaffold` | Scaffold | ✅ Complete (committed to `develop`) |
| `feature/phase-2-core-pipeline` | Core Pipeline | ⬅️ Active |
| `feature/phase-3-visualization-interaction` | Visualization & Interaction | 🔜 |
| `feature/phase-4-architectural-overlay` | Architectural Overlay | 🔜 |
| `feature/phase-5-refinement` | Refinement | 🔜 |

### Update PLAN.md with every commit

Before every commit on a phase branch, update PLAN.md to reflect:
- Tasks completed in this commit (checked off with commit SHA)
- Tasks in progress
- Build status
- Any changes to scope or dependencies

This keeps PLAN.md as the single source of truth for "what's done, what's next."

---

## Phases

### Phase 0: Design ✅ (Complete)
- 19 design decisions resolved in interview
- Full artifact: `specs/architecture.md`

### Phase 1: Scaffold ✅ (Complete — committed `93d566c`)
- Client: Vite + React + FSD structure with feature stubs
- Server: Express + parser plugin registry + graph builder + 7 health checks
- Skills: `project-context` (generic loader), `update-project-context` (local `.claude/memory/` instead of global path)
- Build status: Both `tsc --noEmit` pass (0 errors)

### Phase 2: Core Pipeline ✅ (Complete)

All 6 tasks implemented, tested, and typechecked. Full end-to-end pipeline: drop a folder → server parses → graph renders in 3D/2D.

| # | Task | Status | Key files |
|---|------|--------|-----------|
| 1 | **TypeScript parser** — TS Compiler API AST visitor: extracts imports, classes, interfaces, functions, variables, enums, type-aliases; tsconfig-aware resolution; re-export two-hop edges; graceful error handling | ✅ Done | `server/src/parsers/typescript.ts` |
| 2 | **DropZone** — File System Access API (`showDirectoryPicker`), drag-and-drop with `webkitGetAsEntry`, recursive directory reader, fallback to `webkitdirectory` input, loading/error states | ✅ Done | `client/src/features/drop-zone/index.tsx` |
| 3 | **3D graph** — R3F Canvas with sphere nodes (color/sized by kind), line edges (accessible/inaccessible), 3 layout modes (spherical/concentric/force-directed), auto-rotate OrbitControls | ✅ Done | `client/src/features/graph-3d/index.tsx` |
| 4 | **2D graph** — D3 force simulation with circles (color by kind), labels on file nodes, zoom/pan, drag behavior, collision detection | ✅ Done | `client/src/features/graph-2d/index.tsx` |
| 5 | **Client → server wiring** — DropZone collects files → `POST /api/parse` → `buildGraph()` + `analyzeGraph()` → render 3D/2D | ✅ Done | `client/src/shared/api/index.ts`, `server/src/index.ts` |
| 6 | **Testing** — vitest configured, 27 tests across 6 fixture projects (imports, classes, re-exports, tsconfig aliases, enums, syntax errors, edge cases) | ✅ Done | `server/vitest.config.ts`, `server/src/parsers/__tests__/` |

### Phase 3: Visualization & Interaction ⬅️ (Next)

| # | Task | Description |
|---|------|-------------|
| 7 | **Layout switcher** — force-directed / spherical / concentric rings | UI + 3D layout algorithms |
| 8 | **Search & zoom-to-node** — real-time typeahead, camera animation | Search feature |
| 9 | **Two-point tracing** — Ctrl+click nodes, path highlight + animated tracer | Search feature |
| 10 | **Dark/light theme toggle** | Theme system |
| 11 | **Detail panel** — node info on click (imports, exports, health, metrics) | Details feature |

### Phase 4: Architectural Overlay

| # | Task | Description |
|---|------|-------------|
| 12 | **Circular dependency detection** — cycle highlighting | Analyzer + UI overlay |
| 13 | **God class detection** — 500+ lines / 20+ methods | Analyzer + UI overlay |
| 14 | **Deep inheritance** — extends chain > 3 levels | Analyzer + UI overlay |
| 15 | **DIP violations, hub/spoke, low cohesion, type coverage** | Analyzer + UI overlay |
| 16 | **Health heatmap** — cool-to-warm gradient on nodes | Overlay feature |

### Phase 5: Refinement

| # | Task | Description |
|---|------|-------------|
| 17 | **"Cagey" privacy rendering** — private member visuals | Graph rendering |
| 18 | **More language parsers** — Python, Java, Go, Rust, etc. | Parser plugins |
| 19 | **Accessibility** — dashed edges + lock icons for blocked paths | Search feature |
| 20 | **Responsive UI** — floating panels on desktop → toolbar on narrow | Layout |
| 21 | **Customizable presets** — node shapes, colors, themes | Settings |

### Future

- WASM offline mode (no backend needed)
- CI integration (PR check)
- Git-aware visualization (changed vs unchanged files)
- Plugin marketplace for community parsers

---

## Build Status

| Check | Status |
|-------|--------|
| Client TypeScript | ✅ 0 errors (`tsc --noEmit`) |
| Server TypeScript | ✅ 0 errors (`tsc --noEmit`) |
| Client tests | ⏳ Not configured (next: Phase 3) |
| Server tests | ✅ 27/27 pass (`vitest`) |
| Dev server runs | ✅ Server on :3001, Client on :5173 |
| Health check | ✅ `GET /api/hello` → 200 `{"status":"ok"}` |
| Smoke test | ✅ 4 PASS, 3 SKIP (no client tests yet) — report at `data/smoke_report.md` |

---

## Known Conditions

- **Server `/api/parse`** — now wired to real parsers + builder + analyzer; accepts multipart form with `files` field
- **Client tests not configured** — planned for Phase 3 alongside new feature tests
- **Node.js 18+ required** — Vite 5 requires it
- **`npm run dev` uses `concurrently`** — already installed as a dev dependency
- **3D "force-directed" layout** — currently uses spherical fallback; true force simulation planned for Phase 3
- **SearchPanel "zoom-to-node"** — click handler has TODO; to be wired in Phase 3

## How to Run

```bash
# Install all dependencies (root workspace)
npm install

# Start both client and server (concurrently)
npm run dev
# → Vite on http://localhost:5173
# → Express on http://localhost:3001

# Or start individually:
cd client && npm run dev     # Vite only
cd server && npm run dev     # Express only
```

---

## Commits

| SHA | Branch | Description |
|-----|--------|-------------|
| SHA | Branch | Description |
|-----|--------|-------------|
| `f7c4709` | `main` | Initial commit (pre-scaffold) |
| `93d566c` | `develop` / `feature/phase-1-scaffold` | Initial scaffold: client + server + design artifact + skills |
| `b8567eb` | `feature/phase-2-core-pipeline` | PLAN.md workflow section + branch convention |
| `2306ab3` | `feature/phase-2-core-pipeline` | Polish: simplify task table, retroactive phase-1 branch |
| `f6d840c` | `feature/phase-2-core-pipeline` | Fix PLAN.md: commits table, branch labels, phase-4 name |
| `ca85e77` | `feature/phase-2-core-pipeline` | Adopt `feature/` branch naming convention |
