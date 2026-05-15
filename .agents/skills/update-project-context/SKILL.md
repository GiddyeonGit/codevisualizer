---
name: update-project-context
description: |
  Update project context files after a work session. Use when the user asks to update context,
  save session state, or when significant work has been completed and project documentation
  needs refreshing. Checks for .claude/local-context.md first, then falls back to
  .claude/CONTEXT.md. Also updates memory files if they exist.
---

# Update Project Context

## Workflow

1. **Find Context File**
   - First search for `.claude/local-context.md` starting from the current working directory.
   - Walk up to the project root (look for markers: `pyproject.toml`, `package.json`, `.git`, `PLAN.md`).
   - **If `local-context.md` is found:** set `CONTEXT_FILE` to that path. This is the project's preferred context file.
   - **If `local-context.md` is not found:** fall back to searching for `.claude/CONTEXT.md` using the same walk-up pattern.
   - **If neither is found:** ask: "No local-context.md or CONTEXT.md found in this project. Create one?"
     - If yes: gather context from the current session and create `.claude/local-context.md` at the project root.
     - If no: stop.

2. **Read Current Contents**
   - Read the existing file in full.

3. **Check Recent Git Commits**
   - Run `git log --oneline -10` to see the 10 most recent commits in the current branch.
   - Include a "## Recent commits" section in the update that lists the commit messages (SHA + subject line).
   - If there are no new commits since the last update, note that explicitly.

4. **Update**
   - Reflect what was built or changed in the current session.
   - Update test status (passing count, failing count).
   - Update current ports/config if changed.
   - Update "what's next" section.
   - Preserve all existing sections — only update what has changed.
   - Keep the file under ~500 lines. Trim outdated detail rather than appending indefinitely.
   - If there is something out of scope done in this session, put it in an "out-of-scope" section at the bottom, especially bugs and new features developed without test implementation.
   - Update the relevant section in PLAN.md if the project has one and it needs updating.

5. **Update Local Memory Files**
   - Check for memory files under `.claude/memory/` within the project root.
   - If there are memory values to persist and `.claude/memory/` doesn't exist yet, create it.
   - Update memory files if they exist and are stale.
   - Memory files are local to the project — each project keeps its own `.claude/memory/` directory, avoiding global clutter.

6. **Confirm**
   - Tell the user what was updated, which context file was used, and what the new "current state" line says.

## Rules

- Never create a new context file from scratch — only update an existing one (unless user explicitly requested creation).
- Never update context files from a different project.
- Prefer `local-context.md` over `CONTEXT.md` when both exist — `local-context.md` is the modern, project-isolated format.
- Keep the file under ~500 lines. Trim outdated detail rather than appending indefinitely.
- Do not touch global config files or memory from other projects.
