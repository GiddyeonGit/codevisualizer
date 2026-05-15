---
name: openrouter-delegation
description: |
  Large-context and ultra-cheap delegation to openrouter 2.5 Flash (1M token window). Use when:
  Do NOT delegate for architectural decisions, debugging, root-cause analysis, safety-critical code,
  or when exact line numbers are needed for editing.
---

# openrouter Delegation

## When to Delegate to openrouter

| Scenario | Model | Why |
|----------|-------|-----|
| news >128K tokens combined | `openrouter-3.1-flash-lite` | 1M context window |
| Ultra-cheap bulk reads, simple summaries | `openrouter-2.5-flash-lite` | $0.075/1M — cheapest option |
| Beckhoff/TwinCAT domain questions | `openrouter-3.1-flash-lite` | Script has MCP tools for beckhoff_kb |

## When NOT to Delegate

- Tasks under ~2000 tokens (overhead not worth it)
- Architectural decisions and system design
- Debugging and root-cause analysis
- Safety-critical code and security review
- Anything requiring careful reasoning or judgment
- When exact line numbers are needed for editing

## Invocation

Call the existing script via PowerShell. No PATH checks, no confirmation:

```powershell
& "C:\Users\User\.local\bin\ask-openrouter.bat" --paths <file1> <file2> ... --question "<question>"
```

For ultra-cheap mode:
```powershell
& "C:\Users\User\.local\bin\ask-openrouter.bat" --paths <file> --question "<question>" 
```

Requires `openrouter_API_KEY` env var.

## Beckhoff/TwinCAT Special Rule

When the question involves TwinCAT, PLC programming, Beckhoff hardware, EtherCAT, or function blocks,
delegate to openrouter via the script above. The script includes `search_beckhoff`, `fetch_full_section`,
and `list_documents` MCP tools. Do NOT attempt to answer Beckhoff questions from general knowledge alone.
