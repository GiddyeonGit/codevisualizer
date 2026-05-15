# Code Visualizer Context

Interactive code dependency visualizer with 3D/2D views. Drop a file/folder → scans dependencies → renders as an interactive graph.

## Current state

**Project scaffolded and building clean.** Full monorepo structure with client (Vite+React+FSD) and server (Node.js+Express). Both TypeScript builds pass with zero errors.

### Session: TS Parser spec interview + context update (2026-05-16)

**What was done:**
- Loaded project context (project-context skill)
- Conducted interview-me session to design the TypeScript parser spec for Phase 2
- 11 design decisions resolved + rapid round on 4 remaining areas

### Session: Phase 2 implementation + commit + merge (2026-05-16)

**What was done — all 6 Phase 2 tasks completed, committed, and merged to `develop`:**

1. **TypeScript parser** (`server/src/parsers/typescript.ts`) — TS Compiler API AST visitor extracting 7 entity kinds (file, class, interface, function, variable, enum, type-alias), tsconfig-aware import resolution (paths + baseUrl) with extension probing, re-export two-hop edges, graceful error handling with `hasErrors` flag
2. **DropZone** (`client/src/features/drop-zone/index.tsx`) — File System Access API (`showDirectoryPicker`), drag-and-drop with `webkitGetAsEntry` recursive directory reader, `webkitdirectory` fallback, loading/error/dragging states
3. **3D graph** (`client/src/features/graph-3d/index.tsx`) — R3F Canvas with sphere nodes (color/sized by kind for all 7 types), line edges (accessible/inaccessible styling), 3 layout modes (spherical, concentric, force-directed with spherical fallback), auto-rotate OrbitControls
4. **2D graph** (`client/src/features/graph-2d/index.tsx`) — D3 force simulation with collision detection, circles colored by kind, labels on file nodes, zoom/pan via d3.zoom(), drag behavior
5. **Client → server wiring** — `parseProject()` API client on frontend → `POST /api/parse` → `buildGraph()` + `analyzeGraph()` on backend; file extraction from multer uploads, tsconfig detection
6. **Testing** (`server/vitest.config.ts`, `server/src/parsers/__tests__/`) — vitest with 27 tests across 6 fixture projects (simple-imports, classes/interfaces, re-exports, tsconfig aliases, enums/type-aliases, syntax errors, edge cases, metrics)

**Additional:**
- Updated client types (`shared/api/types.ts`) to match server (`'enum'`, `'type-alias'`, `exportCount`, `hasErrors`, `reExports`)
- Implemented `DetailPanel` with metrics, kind badge, children list
- Implemented `SearchPanel` with real-time filtering
- Implemented `OverlayControls` with view/layout mode toggles
- Fixed 3 TypeScript errors (null→undefined cast, void/File[] type mismatch, bufferAttribute args)
- Polish: removed redundant `useFrame` in 3D, all entity nodes visible, cleaned dead code in DetailPanel
- Made `run-smoke` skill project-generic (auto-detects Node.js, Python, Rust, Go)
- Updated PLAN.md with Phase 2 completion status
- **Commits:** `ac0c9c9` (Phase 2 implementation, 37 files, +2669/-286) merged fast-forward to `develop`
- **Build:** Client 0 errors, Server 0 errors, 27/27 tests pass

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18, TypeScript, Vite |
| 3D | react-three-fiber (R3F), drei |
| 2D | D3.js force simulation |
| Backend | Node.js, Express, multer, cors |
| Parsers | Plugin architecture (TS compiler API, Python AST, etc.) |
| Monorepo | npm workspaces (`client/`, `server/`) |
| Backend port | 3001 |
| Dev command | `npm run dev` (root) — starts both client (Vite) and server (tsx) |
| Testing | vitest (server, 27 tests); client not yet configured |

## Conventions

- **Naming:** camelCase for JS/TS utilities, PascalCase for React components, kebab-case for file names
- **FSD:** Feature-Sliced Design (app → features → entities → shared)
- **File extensions:** `.tsx` for files containing JSX, `.ts` for pure logic/types
- **Git branches:** `feature/<phase-name>` convention, one branch per thematic phase, updated PLAN.md with each commit
- **Graph model:** Nodes (files/classes/entities) + Edges (imports) + Metadata (health, metrics, re-exports)
- **Layouts:** Force-directed 3D (spherical fallback), Spherical/Globe, Concentric rings
- **Themes:** Dark mode only (light toggle in Phase 3)
- **Health visualization:** Heatmap scale (Phase 4)

## What's next (on `develop`, preparing Phase 3)

### Phase 3: Visualization & Interaction

1. **Layout switcher** — force-directed / spherical / concentric rings with active transition
2. **Search & zoom-to-node** — wire SearchPanel click to navigate 3D/2D camera to node
3. **Two-point tracing** — Ctrl+click nodes, path highlight + animate tracer
4. **Dark/light theme toggle** — full theme system with CSS variables
5. **Detail panel enhancements** — show imports/exports, health warnings, code preview

## Recent commits (on `develop`)
- `5c99cc3` Plan: mark Phase 2 as complete (merged to develop)
- `ac0c9c9` **Phase 2: Core Pipeline** — TS parser, DropZone, 3D/2D graphs, wiring, 27 tests (+2669/-286, 37 files)
- `7f23890` Add missing commits to PLAN.md table
- `ca85e77` Adopt `feature/` branch naming convention
- `f6d840c` Fix PLAN.md: commits table, branch labels, phase-4 name
- `2306ab3` Polish PLAN.md: simplify task table, retroactive phase-1 branch
- `b8567eb` Update PLAN.md with workflow section and phase-2-core-pipeline branch
- `93d566c` Initial scaffold (on `develop` / `feature/phase-1-scaffold`)
- `f7c4709` Initial commit (on `main`)

## Out of scope / known issues

- `.claude/CONTEXT.md` is stale (belongs to trading bot project). All codevisualizer context lives in `local-context.md`.
- Client tests not yet configured — planned for Phase 3.
- 3D "force-directed" layout uses spherical fallback — true force sim planned for Phase 3.
- SearchPanel click handler has TODO — zoom-to-node to be wired in Phase 3.
- No memory directory at this project's `.claude/memory/` — not created as no memory values to persist yet.
