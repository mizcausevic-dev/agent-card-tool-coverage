import type {
  AgentCard,
  CoverageOptions,
  CoverageReport,
  DeclaredTool,
  McpTool,
  McpToolsListResult,
  MatchedTool,
  SideEffectClass
} from "./types.js";

/** Compare an AgentCard's declared tools to an MCP server's tools/list snapshot. */
export function coverage(
  card: AgentCard,
  list: McpToolsListResult,
  opts: CoverageOptions = {}
): CoverageReport {
  if (!card || !card.capabilities) throw new Error("AgentCard.capabilities is required");
  if (!list || !Array.isArray(list.tools)) throw new Error("tools/list result must have a tools array");

  const declared = card.capabilities.tools ?? [];
  const norm = (s: string): string => (opts.caseInsensitive ? s.toLowerCase() : s);

  const declaredByName = new Map<string, DeclaredTool>();
  for (const t of declared) declaredByName.set(norm(t.name), t);

  const availableByName = new Map<string, McpTool>();
  for (const t of list.tools) availableByName.set(norm(t.name), t);

  const missing: DeclaredTool[] = [];
  const matched: MatchedTool[] = [];
  for (const [n, d] of declaredByName) {
    const m = availableByName.get(n);
    if (m) matched.push({ name: d.name, declared: d, available: m });
    else missing.push(d);
  }

  const undeclared: McpTool[] = [];
  for (const [n, a] of availableByName) {
    if (!declaredByName.has(n)) undeclared.push(a);
  }

  const declaredBySideEffect = countSideEffects(declared);

  const conformant = missing.length === 0 && (!opts.strict || undeclared.length === 0);

  return {
    declared: declared.length,
    available: list.tools.length,
    missing,
    undeclared,
    matched,
    conformant,
    declaredBySideEffect
  };
}

function countSideEffects(tools: DeclaredTool[]): Record<SideEffectClass, number> {
  const counts: Record<SideEffectClass, number> = { read: 0, mutating: 0, external: 0, destructive: 0 };
  for (const t of tools) {
    if (t.side_effects in counts) counts[t.side_effects] += 1;
  }
  return counts;
}
