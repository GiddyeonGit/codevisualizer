# Trading Bot Context

Personal multi-strategy trading bot. Browser UI on localhost, FastAPI backend, Binance testnet (crypto) + OANDA demo (forex).

## Current state
**On `feature/multiticker_backtest`. Latest commit `42d9fcc` (Fix LOT_SIZE order failures, add preset/bot delete, keep saved bots on restart). All changes committed. Week 17 (skill rules + smoke cleanup + broker hardening) complete but not committed yet.**

### Test status (smoke run 2026-05-15)
- **Smoke (pytest):** 40/42 passed, 2 skipped.
- **Playwright:** 27/28 passed, 1 failed (backtest.spec.ts).
- **Backend unit:** 889/912 passed, 7 failed (pre-existing: MagicMock binding + UTC offset mocks).
- **Frontend vitest:** 229/293 passed, 62 failed (BotPage.tsx crash — pre-existing).
- **Total:** 1185 passed, 70 failed, 5 skipped.
- **Week 17 changes:** all clean (0 regressions).

### What shipped this session

**Committed (`42d9fcc`):** LOT_SIZE filter fix (two root causes — client mismatch + Decimal.quantize bug), saved bots on restart, bot delete endpoint + UI, preset delete button, `_build_bot_status` guard.

**Uncommitted (Week 17):**
- LoadingButton propagation rule added to front-end skill.
- Smoke test cleanup fixture (`cleanup_test_bots` in conftest.py) — instance-based.
- Dual-client metadata + Decimal.quantize() rules added to tradebot skill + inline comments.
- Bot delete open-position check (409 if positions exist).
- All 4 task-observer observations marked ACTIONED.

### Recent commits (most recent first)
- `42d9fcc` Fix LOT_SIZE order failures, add preset/bot delete, keep saved bots on restart
- `84cf43b` Phase 1: LoadingButton migration, smoke test fixes, spec-coverage gate, T1 tests
- `2f2ddf0` plan.md updated
- `c305ae5` update context.md and settings only.
- `748c61c` test spec sheet
- `9d333ae` fixed backtesting, fixed front end button shit, bots somehow not working on new trades anymore
- `ae36ba3` fixed backtesting, fixed front end button shit, bots somehow not working on new trades anymore
- `2a2de01` Disable Run Backtest when no broker selected + fix tests
- `6fe19c4` Fix trade table rendering in backtest results + add candle fetch error handling
- `3919f6c` just settings

## What's next
1. **Commit Week 17 changes** (skill rules, smoke cleanup, broker inline comments, delete open-position check).
2. **Fix BotPage runtime error:** `bots` is undefined at `BotPage.tsx:493`. Blocks 62 BotPage tests.
3. **Fix pytest-cov conflict** so backend unit tests can run.
4. **Remove debug logging** from `_get_step_size`/`_format_qty` now that LOT_SIZE fix is confirmed.
5. **Week 16 strategies ideation** (TA-Lib, stale-profit-stop, strength/weakness patterns).

## Known surface to watch
- `BotPage.tsx:493` — `bots.length` crashes when `bots` is undefined.
- Debug logging in `binance.py`/`binance_futures.py` — should be removed before next release.
- `CandleService.fetch_and_store` writes via `CandleStore.write` **without** passing `market_type` (defaults to SPOT).
- **Resume logic:** Killed bots auto-cleaned from `running_bots` on startup. Bots with no positions kept but not resumed.
- **Post-LoadingButton:** All dangerous buttons use `LoadingButton`. New buttons should follow this pattern.

## Out of scope / bugs discovered
- **BotPage.tsx runtime crash** (`bots.length` on undefined) introduced during saved-bots integration. Not yet fixed.
- **pytest-cov conflict** prevents backend unit test execution. Needs config fix.
- **Debug logging** in `binance.py`/`binance_futures.py` should be removed before next release.

## Spec / plan locations
- Week 15 specs in git history under commit `09720a1`.
- Approved review plan from prior session: `C:\Users\User\.claude\plans\gentle-greeting-lantern.md`
- Approved frontend-coverage plan: `C:\Users\User\.claude\plans\okay-now-go-through-bubbly-key.md`
- Frontend behavior contract: `docs/frontend_behavior_spec.md` — source of truth for every UI button's expected behavior.
- Week 16 kimi specs: `.kimi_specs/week16/` (gitignored, local artifacts)
- Week 17 kimi specs: `.kimi_specs/week17/` (gitignored, local artifacts)

## Architecture
See `docs/backend_deps.md` for the Mermaid dependency diagram. Re-run `tools/gen_dep_diagram.py` after structural import changes. See `docs/history/dev_log.md` for per-week delivery summary.

Key patterns:
- Protocol-based design (`BrokerProtocol`, `StrategyProtocol`, `TickerProtocol`)
- `BotConfig` frozen dataclass in `engine/types.py`
- Schema migrations via `_safe_add_column`
- Profit-lock trailing stops, tick-execution mode, risk snapshots
- Multi-ticker backtest with Capital Model A
- **Auth flow (Week 15):** Bearer token → `data/api_token`. All `/api/*` gated except `/api/hello`, `/api/auth/bootstrap`, `/api/ws`.
- **Credentials flow:** CredentialsSetup UI → `POST /api/credentials` → `CredentialsStore` (keyring/AES).
- **LoadingButton pattern:** Reusable component in `ui.tsx` — wraps `<Button>` with `loading`, built-in 300ms double-click guard, `minLoadingMs`.

## Tech stack
| Layer | Choice |
|-------|--------|
| Backend | Python 3.13, FastAPI, SQLite, Parquet |
| Frontend | React 18, TypeScript, Vite 5, React Router 7 |
| Testing | pytest, vitest, Playwright |
| Observability | WebSocket status push, structured error store |
| Secrets | keyring (Windows Credential Manager) or AES (Fernet) |
