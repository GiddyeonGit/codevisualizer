# Code Visualizer Context

Interactive code dependency visualizer with 3D/2D views. Drop a file/folder → scans dependencies → renders as an interactive graph.

## Current state

**Project scaffolded and building clean.** Full monorepo structure with client (Vite+React+FSD) and server (Node.js+Express). Both TypeScript builds pass with zero errors.

### Session completed: Scaffold + Skills + Observations (2026-05-15)

**What was built:**
- **Client:** Vite + React 18 + TypeScript with FSD structure (app/features/entities/shared). Feature stubs for DropZone, Graph3D (R3F), Graph2D (D3.js), Search, OverlayControls, DetailPanel. Types aligned with server.
- **Server:** Express + multer, parser plugin architecture (TypeScript + Python stubs registered), graph builder with dedup, 7 health check analyzers stubbed.
- **Root:** npm workspaces monorepo, shared tsconfig, .gitignore.

**Skills work:**
- Created generic `project-context` skill (project-agnostic, auto-discovers project root, reads `.claude/local-context.md`)
- Updated `update-project-context` skill to prefer `local-context.md` first, fall back to `CONTEXT.md`
- Deleted old project-specific `codevis-context` skill

**Observations logged (task-observer):**
- `.ts` vs `.tsx` JSX convention → General convention (no skill target)
- Code-reviewer catches wiring bugs `tsc` misses → New: scaffold-wiring-checklist

### Build status
- **Client:** `tsc --noEmit` — 0 errors
- **Server:** `tsc --noEmit` — 0 errors
- **Tests:** Not yet set up

## Project structure

```
codevisualizer/
├── client/
│   ├── src/
│   │   ├── app/
│   │   │   └── App.tsx                 # Main shell (DropZone → workspace)
│   │   ├── features/
│   │   │   ├── drop-zone/index.tsx     # Drag/drop + file picker
│   │   │   ├── graph-3d/index.tsx      # R3F canvas stub
│   │   │   ├── graph-2d/index.tsx      # D3 force simulation stub
│   │   │   ├── search/index.tsx        # Search bar
│   │   │   ├── overlay/index.tsx       # Layout switcher + health toggles
│   │   │   └── details/index.ts        # Detail panel (stub)
│   │   ├── entities/                   # Barrel (FSD layer)
│   │   └── shared/api/
│   │       ├── types.ts                # GraphNode, GraphEdge, GraphData
│   │       └── index.ts                # parseProject() API client
│   ├── index.html
│   ├── vite.config.ts                  # Proxy /api → localhost:3001
│   └── package.json
├── server/
│   ├── src/
│   │   ├── index.ts                    # Express app (port 3001)
│   │   ├── types.ts                    # Server types (mirrors client)
│   │   ├── parsers/
│   │   │   ├── index.ts                # Parser registry (TS + Python registered)
│   │   │   ├── typescript.ts           # TS parser stub
│   │   │   └── python.ts               # Python parser stub
│   │   └── graph/
│   │       ├── builder.ts              # buildGraph() with dedup
│   │       └── analyzer.ts             # 7 health checks (stubbed)
│   └── package.json
├── specs/
│   └── architecture.md                 # Full design artifact (19 decisions)
├── .agents/skills/
│   ├── project-context/SKILL.md        # Generic project context loader
│   └── update-project-context/SKILL.md # Updated to prefer local-context.md
├── .claude/
│   ├── CONTEXT.md                      # (stale — belongs to trading bot project)
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
| Dev command | `npm run dev` (root) — starts both client (Vite) and server (ts-node) |
| Testing | vitest (frontend), jest (backend) — not yet configured |

## Conventions

- **Naming:** camelCase for JS/TS utilities, PascalCase for React components, kebab-case for file names
- **FSD:** Feature-Sliced Design (app → features → entities → shared)
- **File extensions:** `.tsx` for files containing JSX, `.ts` for pure logic/types
- **Graph model:** Nodes (files/classes) + Edges (imports) + Metadata (health, visibility)
- **Layouts:** Force-directed 3D, Spherical/Globe, Concentric rings
- **Themes:** Dark + Light mode toggle
- **Health visualization:** Heatmap scale (cool → warm)

## What's next

1. **Implement the TypeScript parser** — extract imports, classes, interfaces, and functions from file contents using the TS compiler API
2. **Implement the DropZone** — wire up File System Access API to read files from a dropped directory
3. **Build the 3D graph** — R3F canvas with sphere nodes, edge lines, OrbitControls
4. **Build the 2D graph** — D3 force simulation rendering
5. **Connect client to server** — DropZone → POST /api/parse → render result
6. **Set up testing** — vitest for client, jest for server

## Recent commits
- `f7c4709` Initial commit (pre-scaffold)

No new commits this session — scaffolding not yet committed.

## Out of scope / known issues

- `.claude/CONTEXT.md` is stale (belongs to trading bot project). All codevisualizer context lives in `local-context.md`.
- No test suite configured yet — scaffold phase only.
- Server `/api/parse` and `/api/trace` endpoints return stub data until parsers are implemented.
- No git commits this session — scaffolding not yet committed.
