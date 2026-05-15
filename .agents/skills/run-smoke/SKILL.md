# Run Smoke (Generic)

Generic project smoke test orchestrator. Auto-detects project type and runs
the appropriate smoke test suite. Works with Node.js monorepos, single-package
Node.js, Python, Rust, and Go projects.

## Step-by-step Orchestration (for the parent agent)

The parent agent (Buffy) must execute each step sequentially, spawning basher
agents. Do NOT try to run everything in one command — each step depends on the
previous one.

---

### Step 0: Discover project root

Walk up from CWD looking for markers: `.git`, `package.json`, `pyproject.toml`,
`Cargo.toml`, `go.mod`, `composer.json`, `PLAN.md`. First match wins → `PROJECT_ROOT`.

### Step 1: Detect project type

Run these checks inside `PROJECT_ROOT`:

| Marker file | Project type | Workspaces? |
|---|---|---|
| `package.json` with `"workspaces"` array | Node.js monorepo | Check client/, server/, or each listed workspace |
| `package.json` without workspaces | Node.js single | Single package |
| `pyproject.toml` or `requirements.txt` | Python | — |
| `Cargo.toml` | Rust | — |
| `go.mod` | Go | — |
| None of the above | unknown | — |

Also read `.claude/local-context.md` if it exists — it stores port numbers,
test commands, and build conventions.

### Step 2: Kill stale processes (Windows safe)

```bash
# Kill processes on common dev ports (3000, 3001, 5173, 5050)
# Use port numbers from local-context.md if available
for port in 3000 3001 5173 5050; do
  pid=$(netstat -ano | findstr ":$port " | awk '{print $5}' | sort -u)
  if [ -n "$pid" ]; then
    taskkill //F //PID "$pid" 2>/dev/null || true
  fi
done
```

If local-context.md specifies custom ports (e.g., `PORT=8080`), use those
instead of or in addition to the defaults.

### Step 3: Build / typecheck

Spawn basher agents in **parallel** for each workspace that has a `tsconfig.json`
or equivalent build config.

**Node.js monorepo:** For each workspace with a `tsconfig.json`:
```
cd {workspace} && npx tsc --noEmit
```
If both client and server have tsconfigs, run both in parallel.

**Node.js single:** `npx tsc --noEmit` (if tsconfig.json exists), else `npm run build`.

**Python:** `python -m compileall .` or `mypy .` if `mypy.ini` exists.

**Rust:** `cargo check`

**Go:** `go build ./...`

If ANY build step fails: **stop and report**. Do not proceed to tests.

### Step 4: Start services (if applicable)

**Backend (Node.js):**
```bash
cd server && npx tsx src/index.ts &
# Wait for port (use PORT from server/package.json scripts or local-context.md)
# Retry up to 5 times, 2s apart
for i in 1 2 3 4 5; do
  sleep 2
  curl -s http://localhost:3001/api/hello > /dev/null && break
done
```

**Backend (Python):** `{venv}/python -m uvicorn app.main:app --port 8080 &`

**Backend (Rust):** `cargo run &`

**Frontend (Vite):**
```bash
cd client && npx vite --port 5173 &
# Wait for port 5173
```

If no dev server script exists in `package.json`, skip this step entirely.

### Step 5: Health check

If services were started, hit the health endpoint:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:{PORT}/api/hello
```
Expected: 200 or 204. Path may be `/health`, `/api/hello`, or `/` — check
local-context.md or the server source.

If health check fails: **warn but continue** (some projects don't have a health endpoint).

### Step 6: Run tests

Spawn basher agents in **parallel** for each test runner found.

**Check which test runners are configured:**

Node.js — check `package.json` scripts and `devDependencies`:
- If `"test"` script exists in root `package.json`: `npm test`
- If `vitest` in devDependencies: `npx vitest run`
- If `jest` in devDependencies: `npx jest`
- If `playwright` in config: `npx playwright test`
- For monorepos: check each workspace's `package.json`

Python:
- `pytest tests/smoke/ -m smoke -v` (if `tests/smoke/` exists)
- `pytest tests/unit/ -v` (if `tests/unit/` exists)

Rust: `cargo test`

Go: `go test ./...`

If NO test runner is configured: **skip with advisory** — do not fail.

### Step 7: Generate report

Create `data/` if it doesn't exist. Write two files:

```bash
mkdir -p data
```

**`data/smoke_report.json`** — machine-readable:
```json
{
  "project": "<project-name>",
  "timestamp": "<iso-timestamp>",
  "steps": [
    { "name": "build", "passed": true/false },
    { "name": "services", "passed": true/false },
    { "name": "health", "passed": true/false },
    { "name": "tests", "passed": true/false }
  ]
}
```

**`data/smoke_report.md`** — human-readable with error snippets from any
failed step.

### Step 8: Cleanup

Kill any services started in Step 4:
```bash
# Kill by port (Windows-safe)
for port in 3001 5173; do
  pid=$(netstat -ano | findstr ":$port " | awk '{print $5}' | sort -u)
  if [ -n "$pid" ]; then
    taskkill //F //PID "$pid" 2>/dev/null || true
  fi
done
```

### Step 9: Report to user

Summarize which steps passed/failed. If `data/smoke_report.md` exists, mention
it so the user can open it for details.

---

## Use Case Examples

### Node.js monorepo (Code Visualizer style)
```
Step 0: PROJECT_ROOT = found via .git + package.json
Step 1: Node.js monorepo (client + server workspaces)
Step 2: Kill ports 3001, 5173
Step 3: npx tsc --noEmit (client/) + npx tsc --noEmit (server/)  ← parallel
Step 4: cd server && npx tsx src/index.ts &  (port 3001)
         cd client && npx vite --port 5173 &  (port 5173)
Step 5: curl http://localhost:3001/api/hello
Step 6: npm test
Step 7: write data/smoke_report.json + data/smoke_report.md
Step 8: kill ports 3001, 5173
```

### Python backend (Trading Bot style)
```
Step 0: PROJECT_ROOT = found via .git
Step 1: Python + frontend (Node.js)
Step 2: Kill ports 5050, 5173
Step 3: mypy src/
Step 4: python -m src.main &  (port 5050)
         cd frontend && npm run dev &  (port 5173)
Step 5: curl http://localhost:5050/health
Step 6: pytest && cd frontend && npx playwright test
Step 7: write report files
Step 8: cleanup
```

### Single frontend (React + Vite only)
```
Step 0: PROJECT_ROOT = found via package.json (no workspaces)
Step 1: Node.js single
Step 2: Kill port 5173
Step 3: npx tsc --noEmit  (if tsconfig.json exists)
Step 4: npx vite --port 5173 &
Step 5: curl http://localhost:5173  (expect 200)
Step 6: npx vitest run
Step 7: write report
Step 8: cleanup
```

## Known Caveats

- **Playwright** needs `npx playwright install chromium` run once before first use.
- **Windows**: `taskkill //F //PID` is the correct syntax (double-slashes, not
  single). The shell uses `&&` not `;` for chaining.
- **No test runner configured**: The skill skips test steps with an advisory,
  not a failure.
- **Health endpoint missing**: Warns but continues — some projects don't expose one.
- **Port collisions**: If a port is already in use by a non-project process,
  the skill skips that service start and notes it in the report.
