# agent-card-tool-coverage

Conformance check between an [A2A AgentCard](https://github.com/mizcausevic-dev/agent-cards-spec) and an MCP server's `tools/list`. Answers: **does the agent's declared tool surface match what the server actually exposes?**

> Status: v0.1.0 — Node 20/22 supported, library + CLI.

## Why

The AgentCard `capabilities.tools[]` declares what tools the agent *says* it uses. The MCP server's `tools/list` declares what's *actually* available. These two surfaces tend to drift: a tool gets added on the server before the card is updated, or a tool is removed from the server but still listed in the card. Either drift breaks the trust contract.

This library catches that drift deterministically.

| Bucket | Meaning | Default conformance impact |
|---|---|---|
| **Matched** | Declared in card AND exposed by server | ok |
| **Missing** | Declared in card, NOT exposed by server | fails |
| **Undeclared** | Exposed by server, NOT declared in card | informational (fails under `--strict`) |

## CLI

```
npx agent-card-tool-coverage --card <card.json> --tools <tools-list.json>
                             [--format json|markdown|summary]
                             [--strict] [--case-insensitive]
                             [--out FILE]
```

Exit code:
- `0` — conformant
- `1` — non-conformant
- `2` — usage / I/O error

Drop it into a GitHub Action to gate AgentCard PRs against your current MCP server `tools/list` snapshot (you can capture one with [`mcp-tools-snapshot`](https://github.com/mizcausevic-dev/mcp-tools-snapshot)).

## Library

```ts
import { coverage, toMarkdown, toSummary } from "agent-card-tool-coverage";

const report = coverage(card, toolsList, { strict: false });
//   { declared, available, missing, undeclared, matched, conformant, declaredBySideEffect }

if (!report.conformant) {
  console.error(toSummary(report));            // "fail — 2/4 matched, 2 missing, 1 undeclared"
}
console.log(toMarkdown(report));               // GitHub-flavored summary
```

## Composes with

- [**`agent-cards-spec`**](https://github.com/mizcausevic-dev/agent-cards-spec) — the AgentCard schema this consumes.
- [**`mcp-tools-snapshot`**](https://github.com/mizcausevic-dev/mcp-tools-snapshot) — captures the `tools/list` JSON you feed in via `--tools`.
- [**`a2a-mcp-bridge`**](https://github.com/mizcausevic-dev/a2a-mcp-bridge) — generates AgentCards from MCP descriptors; pair this check to confirm the generated card is still in sync with the live server.
- [**`agent-card-diff`**](https://github.com/mizcausevic-dev/agent-card-diff) — sibling tool for diffing two AgentCards.

## Develop

```
npm install
npm run lint && npm run typecheck && npm run coverage && npm run build
npm run demo
```

## License

[AGPL-3.0-or-later](LICENSE)
