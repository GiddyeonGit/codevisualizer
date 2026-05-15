---
name: project-context
description: |
  Generic project context loader and session initializer. Works in any project
  that has a .claude/local-context.md file. Loads project state from
  the local context file and provides a concise summary before asking what
  to work on next.
  Trigger with "load context", "project state", "what's next", "continue work",
  "local context", or use @project-context.
---

# Project Context

## Session Start Workflow

1. **Discover Project Root**
   - Walk up from the current working directory looking for markers: `.git`, `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `composer.json`, or `PLAN.md`.
   - First match wins. Set `PROJECT_ROOT` to that directory.
   - If no marker found, use the CWD as fallback.

2. **Load Context**
   - Read `{PROJECT_ROOT}/.claude/local-context.md` in full.
   - **If the file does not exist**, ask:
     > "No local-context.md found in this project. Create one?"
     - If yes: create `{PROJECT_ROOT}/.claude/local-context.md` with the template below and populate it based on what you know about the project.
     - If no: stop and ask what the user wants to work on without context.

3. **Summarize** (under 10 lines):
   - Project name and purpose (from the context file)
   - Current state (what's built, what's passing)
   - What's next (top 1-2 items)
   - Ask the user what they want to work on

4. **Wait for User Response**
   - Do not begin any coding or planning until the user responds.

## During the Session

- Reference the conventions in the project's `local-context.md` for coding style, tech stack, and architectural decisions.
- Reference any design or spec files listed in the project's `local-context.md`.
- After significant progress, ask the user: "Update local-context.md with session progress?" If yes, update the file or run `update-project-context`. Never auto-update without asking.

## Template for New Projects

When creating a new `local-context.md`, use this minimal template and fill it in:

```markdown
# {Project Name} Context

{One-line project description}

## Current state

{Summary of current phase: design / prototyping / building / testing / deployed}

## Tech stack

{Key technologies — languages, frameworks, databases, etc.}

## Conventions

{Project-specific conventions: naming, patterns, testing, etc.}

## What's next

{Upcoming tasks or priorities}
```

## Related Skills

- `update-project-context` — updates local-context.md after a work session (if configured for this project).
- `task-observer` — logs skill-improvement observations during work sessions.
