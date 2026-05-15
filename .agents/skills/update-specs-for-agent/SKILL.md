---
name: update-specs-for-agent
description: |
  Create detailed implementation spec files for coding agents.
  Use when the user asks to "spec", "specify", "write specs for",
  or when any task follows the atomic task workflow from PLAN.md.
  IF there is no atomic task in the work flow, do that based on the requirement gathered from PLAN.md and update the document.
  The OUTPUT of this skill is TEXT FILES, not source code.
---

# Update Specs for Agent

## Purpose

Your job is to produce **specification text files** that another agent (or yourself later) will use to write the actual code. **You are NOT writing Python/TypeScript/CSS.** You are writing instructions in plain text.

## When to trigger

- User says "spec this", "write specs for", "create the spec files"
- Beginning any new Week N task from PLAN.md
- Resuming work on a task where no spec file exists yet

## Workflow (mandatory order)

### Step 1: Read context
1. Read `PLAN.md` for the task definition (T{N}.{X})
2. Read `.kimi_specs/format.txt` for the spec file format rules
3. Read any existing code the spec must reference (for "update existing file" specs)

### Step 2: Write spec files
Create files in `.kimi_specs/week{N}/` with exact naming:
```
t{N}_{task_number}_{description}.txt
t{N}_{task_number}_test_{description}.txt
```

Each spec must contain:
- What files are affected (new vs update)
- Exact behavior, signatures, algorithms
- Test cases with specific inputs and expected outputs
- Constraints (no docstrings, Decimal for money, etc.)
- The output directive at the end

### Step 3: Verify completeness
Before finishing, confirm:
- [ ] One spec file per module/file to create
- [ ] One matching test spec file per task
- [ ] All edge cases mentioned (empty input, error paths, concurrency)
- [ ] Format follows `.kimi_specs/format.txt`
- [ ] No em-dashes (use double-hyphen `--` or ASCII only)
- [ ] Plain text, no markdown code fences inside the spec body

### Step 4: STOP
**Do not write any source code.** Do not edit `.py`, `.ts`, `.tsx`, or `.css` files.

Tell the user: "Specs are ready in `.kimi_specs/week{N}/`. Review and approve before implementation begins."

Wait for user approval before proceeding to implementation.

## Expected outcome

The deliverable is a set of `.txt` files in `.kimi_specs/week{N}/`. Nothing else.

Example:
```
.kimi_specs/
  week11/
    t11_2_position_model_extensions.txt
    t11_2_test_position_model_extensions.txt
    t11_0_dashboard_summary_endpoint.txt
    t11_0_test_dashboard_summary_endpoint.txt
```

## Anti-patterns (forbidden)

- Writing `StrReplaceFile` or `WriteFile` against source code during spec creation
- Editing `src/`, `frontend/src/`, or test files before specs are approved
- Creating spec files that are vague (e.g. "implement the thing" without signatures)
- Skipping the test spec file
