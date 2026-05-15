# Smoke Test Report

**Project:** Code Visualizer
**Type:** Node.js monorepo (client + server)
**Branch:** develop
**Timestamp:** 2026-05-16

## Results

| Step | Status | Details |
|------|--------|--------|
| Build: client (tsc --noEmit) | ✅ PASS | 0 errors |
| Build: server (tsc --noEmit) | ✅ PASS | 0 errors |
| Server start | ✅ PASS | Listens on http://localhost:3001 |
| Health check (GET /api/hello) | ✅ PASS | 200 - {"status":"ok"} |
| Tests: client (vitest) | ✅ PASS | 18/18 pass (store + tracer) |
| Tests: server (vitest) | ✅ PASS | 27/27 pass (TypeScript parser) |
| Client dev server (Vite) | ✅ PASS | http://localhost:5173 (200) |

## Summary

- **Passed:** 7 (2 builds + server + health check + client tests + server tests + Vite)
- **Skipped:** 0
- **Failed:** 0
- **Blocking:** None

## Artifacts

- **Phase 2:** TypeScript parser, DropZone, 3D/2D graphs, server API — all ✅
- **Phase 3:** Zustand store, client-side Dijkstra tracing, layout switching (spherical/concentric/force-directed) with animated transitions, search + zoom-to-node, theme toggle (CSS vars + localStorage), enhanced detail panel — all ✅
- **Theme:** Dark/light toggle via data-theme CSS custom properties, persisted to localStorage
- **Tracing:** Client-side Dijkstra, modifier-driven (Ctrl/Cmd+click), animated tracer dot in both 2D and 3D views

## Notes

- All compilers emit 0 errors for both client and server
- 45 total tests pass (18 client + 27 server)
- `/api/parse` endpoint accepts multipart/file uploads — returns 400 for JSON-only requests (expected, matches DropZone flow)
- Vite dev server starts in ~544ms, proxies `/api` to server port 3001
- Cleanup: Server and Vite processes were terminated after testing
