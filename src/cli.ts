#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { coverage } from "./coverage.js";
import { toMarkdown, toSummary } from "./format.js";
import type { AgentCard, McpToolsListResult } from "./types.js";

type Format = "json" | "markdown" | "summary";

interface Args {
  card?: string;
  tools?: string;
  format: Format;
  strict: boolean;
  caseInsensitive: boolean;
  out?: string;
  help: boolean;
}

const FORMATS: Format[] = ["json", "markdown", "summary"];

function parseArgs(argv: string[]): Args {
  const args: Args = { format: "json", strict: false, caseInsensitive: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") args.help = true;
    else if (a === "--card") args.card = argv[++i];
    else if (a === "--tools") args.tools = argv[++i];
    else if (a === "--format") {
      const v = argv[++i] as Format;
      if (!FORMATS.includes(v)) throw new Error(`--format must be one of: ${FORMATS.join(", ")}`);
      args.format = v;
    } else if (a === "--strict") args.strict = true;
    else if (a === "--case-insensitive") args.caseInsensitive = true;
    else if (a === "--out") args.out = argv[++i];
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

const HELP = `agent-card-tool-coverage — conformance check between an A2A AgentCard and an MCP tools/list

Usage:
  agent-card-tool-coverage --card <card.json> --tools <tools-list.json>
                           [--format json|markdown|summary]
                           [--strict] [--case-insensitive] [--out FILE]

Behavior:
  Reports tools that are declared in the AgentCard but missing from the
  server's tools/list (a conformance failure), and tools exposed by the
  server but not declared in the card (a documentation drift).

Exit code:
  0 — conformant (every declared tool is exposed; --strict also requires no undeclared)
  1 — non-conformant
  2 — usage / I/O error`;

export function run(argv: string[]): number {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }
  if (args.help || !args.card || !args.tools) {
    process.stdout.write(`${HELP}\n`);
    return args.help ? 0 : 2;
  }

  let card: AgentCard;
  let tools: McpToolsListResult;
  try {
    card = JSON.parse(readFileSync(args.card, "utf8")) as AgentCard;
    tools = JSON.parse(readFileSync(args.tools, "utf8")) as McpToolsListResult;
  } catch (e) {
    process.stderr.write(`error reading input: ${(e as Error).message}\n`);
    return 2;
  }

  let report;
  try {
    report = coverage(card, tools, { strict: args.strict, caseInsensitive: args.caseInsensitive });
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }

  let out: string;
  if (args.format === "json") out = JSON.stringify(report, null, 2);
  else if (args.format === "markdown") out = toMarkdown(report);
  else out = toSummary(report);

  if (args.out) writeFileSync(args.out, `${out}\n`, "utf8");
  else process.stdout.write(`${out}\n`);

  return report.conformant ? 0 : 1;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  try {
    process.exit(run(process.argv.slice(2)));
  } catch (e) {
    process.stderr.write(`fatal: ${(e as Error).message}\n`);
    process.exit(2);
  }
}
