# Code Visualizer Context

Interactive code dependency visualizer with 3D/2D views. Drop a file/folder → scans dependencies → renders as an interactive graph.

## Current state

**Project scaffolded and building clean.** Full monorepo structure with client (Vite+React+FSD) and server (Node.js+Express). Both TypeScript builds pass with zero errors.

### Session: TS Parser spec interview + context update (2026-05-16)

**What was done:**
- Loaded project context (project-context skill)
- Conducted interview-me session to design the TypeScript parser spec for Phase 2
- 11 design decisions resolved + rapid round on 4 remaining areas

### Session: Spec files written for TypeScript parser (2026-05-16)

**What was done:**
- Wrote 3 spec files in `.kimi_specs/week1/` for Phase 2 Task 1 (TypeScript parser)
- Spec format follows `.kimi_specs/format.txt` conventions (file-per-module, test spec, no em-dashes, plain text)
- Updated PLAN.md to show task 1 design as complete

**Spec files created:**
| File | Coverage |
|------|----------|
| `t1_1_typescript_parser.txt` | TS Compiler API parser: AST visitor, entity extraction, import resolution, re-exports, graceful errors |
| `t1_1_types_and_infrastructure.txt` | Supporting updates: types.ts, parsers/index.ts, builder.ts, server/src/index.ts |
| `t1_1_test_typescript_parser.txt` | 12 test cases on 6 fixture projects -- imports, classes, enums, tsconfig paths, errors |

**No new commits** -- spec files are text only, not source code.

**TypeScript parser design decisions:**
| # | Decision | Choice |
|---|----------|--------|
| 1 | Parser approach | TS Compiler API (ts.createSourceFile + AST visitor) |
| 2 | Entity kinds | All: file, class, interface, function, variable, enum, type-alias |
| 3 | Export scope | All declarations, nest non-exported under parent file |
| 4 | External deps | Leaf marker nodes (external:package-name, isAccessible=false) |
| 5 | Node metrics | Full: lines, methods, deps, inheritance depth, export count |
| 6 | Import resolution | Full tsconfig-aware (reads tsconfig.json for paths/baseUrl) |
| 7 | Output model | Add 'enum' and 'type-alias' to GraphNode.kind |
| 8 | Entity filter | Default detailedNodes=true, toggle to structural-only |
| 9 | Config API | Options param on parse(): ParserOptions { tsconfigPath?, detailedNodes? } |
| 10 | Error handling | Graceful degradation: set hasErrors flag, emit partial data, continue |
| 11 | Testing strategy | Real mini-project fixtures in test/fixtures/ts/ |
| 12 | Re-exports | Two-hop edges: importer → barrel → source |
| — | Rapid: tsconfig paths | Optional tsconfigPath, fallback to extension probing; cached per session |
| — | Rapid: namespace merging | Initial: treat independently, deduplicate by ID in buildGraph |
| — | Rapid: performance | Cap at 10K lines/file, advisory at 500+ files |
| — | Rapid: /api/parse integration | Group files by extension, pass to buildGraph with recursive=false |

### Build status
- **Client:** `tsc --noEmit` — 0 errors
- **Server:** `tsc --noEmit` — 0 errors
- **Server tests:** 27/27 pass (`vitest`)
- **Client tests:** Not configured (Phase 3)
- **Smoke test:** 4 PASS / 3 SKIP — report at `data/smoke_report.md`

## Project structure

```
codevisualizer/
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   └── App.tsx                 # Main shell: DropZone → workspace toggle + panels
│   │   ├── features/
│   │   │   ├── drop-zone/index.tsx     # Drag/drop + FS Access API + recursive dir reader
│   │   │   ├── graph-3d/index.tsx      # R3F: sphere nodes (color/size by kind), edges, 3 layouts, auto-rotate
│   │   │   ├── graph-2d/index.tsx      # D3: force sim, circles, labels, zoom/pan, drag
│   │   │   ├── search/index.tsx        # Real-time search with results list
│   │   │   ├── overlay/index.tsx       # View/layout mode switcher
│   │   │   └── details/index.tsx       # Detail panel: metrics, kind badge, children, close
│   │   ├── entities/                   # Barrel
│   │   └── shared/api/
│   │       ├── types.ts                # GraphNode, GraphEdge, GraphData
│   │       └── index.ts                # parseProject() API client
│   ├── index.html
│   ├── vite.config.ts                  # Proxy /api → localhost:3001
│   └── package.json
├── server/
│   ├── src/
│   │   ├── index.ts                    # Express app (port 3001), real parse endpoint
│   │   ├── types.ts                    # Server types (enum, type-alias, reExports, hasErrors)
│   │   ├── parsers/
│   │   │   ├── index.ts                # Parser registry (TS + Python) with ParserOptions
│   │   │   ├── typescript.ts           # TS Compiler API: AST visitor, 7 entity kinds, tsconfig-aware
│   │   │   ├── __tests__/
│   │   │   │   ├── typescript.test.ts  # 27 tests on 6 fixture projects
│   │   │   │   └── fixtures/ts/        # 6 fixture projects (imports, classes, re-exports, etc.)
│   │   │   └── python.ts              # Python parser stub
│   │   └── graph/
│   │       ├── builder.ts              # buildGraph() with parserOptions
│   │       └── analyzer.ts             # 7 health checks (stubbed)
│   ├── vitest.config.ts
│   └── package.json
├── specs/
│   └── architecture.md                 # Full design artifact (19 decisions)
├── .agents/skills/
│   ├── project-context/SKILL.md        # Generic project context loader
│   ├── update-project-context/SKILL.md # Prefers local-context.md
│   └── run-smoke/SKILL.md             # Generic smoke test (auto-detects project type)
├── data/
│   └── smoke_report.md                 # Latest smoke test results
├── .claude/
│   ├── CONTEXT.md                      # Stale — trading bot project
│   └── local-context.md                # This file
└── package.json                        # Root workspace config
```

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

## What's next (on `feature/phase-2-core-pipeline` → merge to `develop`, then Phase 3)

### Phase 3: Visualization & Interaction

1. **Layout switcher** — force-directed / spherical / concentric rings with active transition
2. **Search & zoom-to-node** — wire SearchPanel click to navigate 3D/2D camera to node
3. **Two-point tracing** — Ctrl+click nodes, path highlight + animate tracer
4. **Dark/light theme toggle** — full theme system with CSS variables
5. **Detail panel enhancements** — show imports/exports, health warnings, code preview

## Recent commits (on `feature/phase-2-core-pipeline`)
- (commits not yet made for Phase 2 implementation — ready to commit and merge)
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
- `PLAN.md` and this file updated with Phase 2 completion — not yet committed.
- No memory directory at `C:\Users\User\.claude\projects` for codevisualizer project — per-project `.claude/memory/` will be created when needed.
