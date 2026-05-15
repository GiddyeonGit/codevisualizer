---
name: gemini-delegation
description: |
  Large-context and ultra-cheap delegation to Gemini 2.5 Flash (1M token window). Use when:
  (1) Files to read exceed ~128K tokens combined or individual files are >400 lines and complex,
  (2) Ultra-cheap bulk summarization or simple analysis is needed (use gemini-2.5-flash-lite),
  (3) Beckhoff/TwinCAT domain questions arise (the Gemini script has beckhoff_kb MCP tools).
  Do NOT delegate for architectural decisions, debugging, root-cause analysis, safety-critical code,
  or when exact line numbers are needed for editing.
---

# Gemini Delegation

## Boundary

**Kimi = thinking + standard coding. Gemini = I/O + very large context.**

## When to Delegate to Gemini

| Scenario | Model | Why |
|----------|-------|-----|
| Files >128K tokens combined | `gemini-3.1-flash-lite` | 1M context window |
| Ultra-cheap bulk reads, simple summaries | `gemini-2.5-flash-lite` | $0.075/1M — cheapest option |
| Beckhoff/TwinCAT domain questions | `gemini-3.1-flash-lite` | Script has MCP tools for beckhoff_kb |

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
& "C:\Users\User\.local\bin\ask-gemini.bat" --paths <file1> <file2> ... --question "<question>"
```

For ultra-cheap mode:
```powershell
& "C:\Users\User\.local\bin\ask-gemini.bat" --paths <file> --question "<question>" --model gemini-2.5-flash-lite
```

Requires `GEMINI_API_KEY` env var.

## Beckhoff/TwinCAT Special Rule

When the question involves TwinCAT, PLC programming, Beckhoff hardware, EtherCAT, or function blocks,
delegate to Gemini via the script above. The script includes `search_beckhoff`, `fetch_full_section`,
and `list_documents` MCP tools. Do NOT attempt to answer Beckhoff questions from general knowledge alone.
