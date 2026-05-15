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
| `phase-1-scaffold` | Scaffold | ✅ Complete (committed to `develop`) |
| `phase-2-core-pipeline` | Core Pipeline | ⬅️ Active |
| `phase-3-visualization` | Visualization & Interaction | 🔜 |
| `phase-4-architectural-overlay` | Architectural Overlay | 🔜 |
| `phase-5-refinement` | Refinement | 🔜 |

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

### Phase 2: Core Pipeline ⬅️ (Next — in priority order)

| # | Task | Key files |
|---|------|-----------|
| 1 | **TypeScript parser** — extract imports, classes, interfaces, functions via TS compiler API | `server/src/parsers/typescript.ts` |
| 2 | **DropZone** — File System Access API to read dropped folders | `client/src/features/drop-zone/` |
| 3 | **3D graph** — R3F canvas with sphere nodes, edges, OrbitControls | `client/src/features/graph-3d/` |
| 4 | **2D graph** — D3 force simulation rendering | `client/src/features/graph-2d/` |
| 5 | **Client → server wiring** — DropZone → POST /api/parse → render result (depends on 1-4) | `client/src/shared/api/`, `server/src/index.ts` |
| 6 | **Testing setup** — vitest (client), jest (server) | Config files |

### Phase 3: Visualization & Interaction

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
| Client tests | ⏳ Not configured |
| Server tests | ⏳ Not configured |
| Dev server runs | ⏳ Not verified (no parser yet) |

---

## Known Conditions

- **Server stubs return empty data** — `/api/parse` and `/api/trace` endpoints return stubs until parsers are implemented
- **No test suite yet** — scaffold phase; vitest/jest not configured
- **Node.js 18+ required** — Vite 5 requires it
- **`npm run dev` uses `concurrently`** — already installed as a dev dependency

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
| `93d566c` | `develop` / `phase-1-scaffold` | Initial scaffold: client + server + design artifact + skills |
| `b8567eb` | `phase-2-core-pipeline` | PLAN.md workflow section + branch convention |
| `2306ab3` | `phase-2-core-pipeline` | Polish: simplify task table, retroactive phase-1 branch |
