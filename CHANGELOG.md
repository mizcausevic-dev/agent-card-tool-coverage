# Changelog

## v0.1.0 — 2026-05-26

- Initial release: conformance check between an A2A AgentCard's declared tools and an MCP server's actual `tools/list`.
- Library API: `coverage(card, list, opts)` returns `{declared, available, missing, undeclared, matched, conformant, declaredBySideEffect}`; `toMarkdown(report)` and `toSummary(report)` formatters.
- CLI: `--card`, `--tools`, `--format json|markdown|summary`, `--strict`, `--case-insensitive`, `--out`. Exit 1 on non-conformance.
- Composes with `agent-cards-spec` (input shape), `mcp-tools-snapshot` (input source), `a2a-mcp-bridge` (regen verification), and `agent-card-diff` (sibling diff tool).
- Node 20/22 CI (lint, typecheck, coverage, build, demo, `npm audit`), AGPL-3.0-or-later, Dependabot.
