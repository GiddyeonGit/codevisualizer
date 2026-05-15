# Code Visualizer — Design Artifact

> The last code visualizer you ever need.
> Experimental tool for humans and AI alike.

---

## Architecture

### 1. Platform
- **Web app** built with **Vite + React**
- **Node.js backend** with Vite proxy — seamless "drop and boom" UX
- Parser runs on the backend (plugin architecture), rendering on the frontend

### 2. Data Flow
```
User drops file/folder
  → Browser reads files via File System Access API
  → Sends file paths/contents to Node.js backend
  → Backend detects language, routes to parser plugin
  → Parser returns graph JSON (nodes + edges + metadata)
  → Frontend renders via R3F (3D) or D3.js (2D)
```

### 3. Language Support
- **Language-agnostic** — auto-detect from file extension / content
- **Plugin architecture** — each language is a parser module:
  - `parsers/typescript.ts` — TypeScript compiler API
  - `parsers/python.ts` — Python AST
  - `parsers/java.ts` — Java parser
  - Extensible: drop in a file to add a language
- **Filtering:** Respect `.gitignore`, hide generated/vendor files

### 4. Scan Depth
- **Transitive** — follow imports recursively through the full project
- **External tracing** — show connections through external packages (with visual distinction)
- Respect `.gitignore` boundaries

---

## Visualization

### 5. Rendering Stack
| Mode | Engine | Purpose |
|------|--------|---------|
| 3D | react-three-fiber (R3F) | Immersive globe view, floating nodes |
| 2D | D3.js force simulation | Clean lines, detailed analysis |

### 6. 2D/3D Interaction
- **Zoom-dependent transition**: Fully zoomed out = 3D celestial globe. Zoom in → seamless transition to 2D for readable details.

### 7. 3D Layouts (user-selectable)
| Layout | Behavior |
|--------|----------|
| **Force-directed** | Physics simulation — nodes repel, edges attract. Organic clusters. |
| **Spherical / Globe** | Nodes on a sphere surface. Rotating globe. |
| **Concentric rings** | Layered by dependency depth. Core at center. |

### 8. Node Model
- **Hybrid**: Files as containers, classes/types nested inside
- Zoomed out → file-level view
- Zoomed in → classes appear inside files
- Max zoom-out → architectural health overview

### 9. Visual Identity
- **Theme**: Both dark + light modes with toggle
- **Node shape**: Uniform dots by default (customizable presets)
- **Health colors**: Heatmap scale — cool (healthy) → warm (problematic)
- **Private members**: "Cagey" visual — cage/haze rendering with distinct color

---

## Architectural Overlay

### 10. Health Checks (all 7)
When zoomed out, the overlay surfaces code architecture quality:

| Check | Detection | Visual |
|-------|-----------|--------|
| Circular dependencies | A→B→C→A cycles | Red glow on cycle nodes |
| God classes | 500+ lines / 20+ methods | Pulsing warm color |
| Deep inheritance | extends chain > 3 levels | Depth indicator on node |
| DIP violations | High-level depends on low-level concrete | Edge warning |
| Hub/spoke coupling | Single node everything depends on | Bright center node |
| Low cohesion | Unrelated methods in one class | Split-color node |
| Missing type coverage | Untyped functions/classes | Faded/dim node |

---

## Interaction Design

### 11. UI Layout
- **Adaptive / responsive**
  - Desktop: Full-screen canvas, floating translucent panels
  - Narrow: Collapses to toolbar layout
- **Panels:**
  - Search bar (top-left, always visible)
  - Layout controls (bottom-left)
  - Filter panel (top-right, collapsible)
  - Node details (bottom-right, on selection)

### 12. Search & Tracing
- **Real-time search**: Type name → filter results → select → camera zooms to node + connected component
- **Two-point tracing**: Ctrl+click node A → Ctrl+click node B → shortest path highlights + animated tracer dot travels the route
- **Inaccessible paths**: Blocked edges (private methods) show as "cagey" dashed lines with lock icon + tooltip explaining the access violation

### 13. Node Interaction
- **Hover**: Tooltip with name, type, key metrics
- **Click**: Detail panel opens (imports, exports, dependencies, health score)
- **Ctrl+click**: Mark for two-point tracing

---

## Project Structure (Proposed)

```
codevisualizer/
├── client/                    # Vite + React frontend
│   ├── src/
│   │   ├── app/               # App entry, layout
│   │   ├── features/          # Feature modules
│   │   │   ├── drop-zone/     # File/folder drag-drop
│   │   │   ├── graph-3d/      # R3F 3D visualization
│   │   │   ├── graph-2d/      # D3.js 2D visualization
│   │   │   ├── search/        # Search & tracing
│   │   │   ├── overlay/       # Architectural health overlay
│   │   │   └── details/       # Node detail panel
│   │   ├── shared/            # Shared components, hooks, utils
│   │   └── main.tsx
│   ├── index.html
│   └── vite.config.ts
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── parsers/           # Language parser plugins
│   │   │   ├── typescript.ts
│   │   │   ├── python.ts
│   │   │   └── index.ts       # Router
│   │   ├── graph/             # Graph construction
│   │   │   ├── builder.ts     # Build graph from parser output
│   │   │   └── analyzer.ts    # Health check analysis
│   │   └── index.ts           # Server entry
│   └── package.json
├── specs/                     # Design specs
└── package.json               # Root workspace
```

---

## Future Considerations
- WASM offline mode (for when no backend is available)
- CI integration (run as a PR check)
- Git-aware visualization (show changed vs unchanged files)
- Plugin marketplace for community parsers and analyzers
