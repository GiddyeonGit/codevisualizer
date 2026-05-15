---
name: tradebot-context
description: |
  Trading bot project context loader and session initializer. Use ONLY when the user is working
  on the trading bot project at C:\Users\User\Desktop\Bot\. Loads project state from
  .claude/CONTEXT.md and provides a concise summary before asking what to work on next.
  Trigger on project entry, session start, or when the user says things like "tradebot",
  "trading bot", "what's next", or "continue work".
---

# Tradebot Context

## Session Start Workflow

1. **Load Context**
   - Read `C:\Users\User\Desktop\Bot\.claude\CONTEXT.md` in full.

2. **Summarize** (under 10 lines):
   - Current state (what week, what's passing)
   - What's next
   - Ask the user what they want to work on

3. **Wait for User Response**
   - Do not begin any coding or planning until the user responds.

## During the Session

- Reference the conventions in CONTEXT.md:
  - Python: snake_case files/functions, PascalCase classes, Decimal for money, UTC-aware datetimes
  - Broker abstraction: `BrokerProtocol` (typing.Protocol, runtime_checkable)
  - Value objects: `@dataclass(frozen=True, slots=True)`
  - Settings: `get_settings()` cached singleton, env prefix `TRADEBOT_`
  - API routes: `/api/` prefix, kebab-case, pydantic v2 response models
  - TypeScript: strict, PascalCase components, camelCase utilities
  - Tests: unit (no I/O, mocked broker), integration (live, gated by `TRADEBOT_RUN_INTEGRATION=1`)
  - E2E: Playwright with **bundled Chromium** (not standalone Chrome). Run `cd src/frontend && npx playwright test e2e/smoke/`. Do NOT use the `browser-use` agent — it's incompatible.

- Atomic task workflow from PLAN.md:
  - **DEFAULT MODE = SPEC CREATION.** When the user asks to work on a task:
    1. Read `.kimi_specs/format.txt`
    2. Read the task definition in `PLAN.md`
    3. Read existing source files referenced by the task
    4. **Create spec files** in `.kimi_specs/week{N}/`
       - Naming: `t{week}_{task}_{description}.txt` and `t{week}_{task}_test_{description}.txt`
    5. **STOP. Do not write code.** Deliverable = spec text files only.
    6. Wait for user approval ("implement it", "code it", "proceed") before touching source files.
  - **IMPLEMENTATION MODE** (only after explicit user approval):
    - Read approved spec files, then write code per the spec.
    - Run tests, fix, commit per task.
  - Each task = one spec file + one test spec file + implementation + Definition of Done
  - test file should cover edge cases (UI/UX, Frontend, Backend, race conditions, modularity, etc)
  - Spec files stored in `.kimi_specs/` (gitignored), plain ASCII, no em-dashes
  - Write -> syntax check -> pytest -> fix -> commit per task

## Conventions Locked In

- Entry: on signal candle close
- Position size: 10% per trade
- Leverage hard ceiling: 50x
- Exit: trailing stop (broker-side) + manual close button + take profit criteria execution
- Timeframes: 1m, 5m, 15m, 30m, 1h, 2h, 4h, 1d
- Watchlist seed: BTCUSDT, ETHUSDT, SOLUSDT, XRPUSDT, ADAUSDT
- Confluence: tickbox UI (user selects which signals must agree)
- Wyckhoff: heuristic (volume spike + range contraction + spring detection)
