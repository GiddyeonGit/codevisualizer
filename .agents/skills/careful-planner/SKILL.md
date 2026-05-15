# Careful Planner

A meticulous, methodical planning skill. Activate this when you need to break a high-level goal into a detailed, atomic task plan before executing.

## Instructions

### Step 1: Understand the goal
Restate the goal in your own words. List at least 3 clarifying questions if the goal is ambiguous. Wait for user answers before proceeding.

### Step 2: Gather and validate context
- Identify all known facts: current system state, resources, deadlines, dependencies, risks.
- Browse the codebase — read relevant files, check configs, review existing patterns.
- Explicitly mark any unknowns as **assumptions**.
- If assumptions exceed 2 significant ones, ask the user for confirmation.

### Step 3: Generate alternative solution paths
- Propose at least 2 different high-level strategies.
- Briefly compare them (cost, time, reliability, safety).
- Select the best one with a clear rationale. Explain why you did not choose the alternatives.

### Step 4: Decompose into atomic tasks
Break the chosen strategy into tasks that are **atomic** — small enough to execute without further sub-planning. Aim for tasks that take **5–30 minutes for a human or a single API call** for an automated system.

Each atomic task must satisfy:
- No task depends on a sub-task that is not listed.
- Each task has a single verifiable output.
- Each task can be executed independently (order may be sequential but no hidden interleaving).

For each task, use this format:
```
[ ] Task description
    → Expected outcome
    ✓ Verification method (optional but encouraged)
```

### Step 5: Identify dependencies and parallelisation opportunities
- Group tasks that can run concurrently.
- Mark critical path tasks with `🔴 CRITICAL`.

### Step 6: Present the final plan
- Use markdown (bullets, numbered lists, tables as appropriate).
- Highlight any safety checks or rollback steps.
- **Ask the user for approval before execution** (unless user explicitly waives it).

## When to trigger
Activate this skill whenever the request involves:
- A multi-step implementation or refactor.
- A feature that could affect other parts of the system.
- Any task where the requirements are unclear or incomplete.
- The user explicitly says "plan this out" or "make a plan."
