---
name: run-smoke
description: |
  Run the full smoke test suite (auto-discovered pytest smoke tests +
  Playwright frontend e2e + backend/frontend unit tests)
  via the single run_smoke.py orchestrator at the project root.
  Use when the user says "run smoke", "smoke test", "run_smoke",
  or "@run-smoke".
---

# Run Smoke

## Behavior

Run `run_smoke.py` from the project root. This single script orchestrates the
complete smoke test pipeline:

1. **Kill old processes** (backend + frontend)
2. **Start backend** (port 5050) with warmup retry
3. **Start frontend** (port 5173)
4. **Auto-generate missing smoke tests**
   - Backend: scans `backend/api/` and creates `tests/smoke/manual/test_smoke_<module>.py`
   - Frontend: scans `src/App.tsx` routes and creates `e2e/smoke/<route>.spec.ts`
5. **Smoke tests** — runs `pytest tests/smoke/ -m smoke -v`
   - `test_api_auto.py` auto-discovers every endpoint from `/openapi.json`
   - `tests/smoke/manual/` contains flow tests (bot lifecycle, backtest, CRUD, etc.)
6. **Playwright e2e** — runs `npx playwright test e2e/smoke/`
   - `offline.spec.ts` tests graceful degradation when backend is down
   - `online.spec.ts` tests full functionality when backend is up
   - Auto-generated route tests cover every React Router route
7. **Full test suites** — backend `pytest tests/unit/` + frontend `npm test -- --run`
8. **Integration tests** — `pytest tests/integration/` (only if `TRADEBOT_RUN_INTEGRATION=1`)
9. **Results + cleanup** — writes `data/smoke_report.json` and `data/smoke_report.md`

## How to Run

When the user invokes `@run-smoke`, run `run_smoke.py` from the project root.

```powershell
cd C:\Users\User\Desktop\Bot
src\.venv\Scripts\python run_smoke.py
```

## Reports

After every run, two files are produced:

- `data/smoke_report.json` — structured machine-readable results
- `data/smoke_report.md` — human-readable summary with failed tests and error snippets

Open `data/smoke_report.md` to inspect what failed and why.

## Auto-Discovery

| What | How |
|---|---|
| New API endpoint | Auto-tested by `test_api_auto.py` via `/openapi.json` |
| New backend API module | Auto-generates `tests/smoke/manual/test_smoke_<module>.py` |
| New frontend route | Auto-generates `e2e/smoke/<route>.spec.ts` |
| New pytest file in `tests/unit/` | Picked up automatically |
| New Playwright `.spec.ts` | Picked up automatically |

## Known Caveats

- **Backtest checks** accept both `200` (candle data present) and `422`
  (no candle data — clean environment). Both count as PASS.
- **Playwright E2E tests** use Playwright's **bundled Chromium** (not a standalone Chrome browser).
  Run `cd src/frontend && npx playwright install chromium` once to install it.
  The `browser-use` agent is incompatible with this project — always use `npx playwright test` for E2E testing.
- **Auto-generated test files** contain TODO placeholders. Fill them in
  when you want full coverage for complex flows.
- **Timeout**: Full run takes ~3-5 minutes (pytest + npm test are the
  slowest steps).
