import type { CoverageReport, SideEffectClass } from "./types.js";

const SIDE_EFFECTS: SideEffectClass[] = ["read", "mutating", "external", "destructive"];

/** GitHub-flavored Markdown summary suitable for posting in CI. */
export function toMarkdown(report: CoverageReport): string {
  const lines: string[] = [];
  lines.push(report.conformant ? `## AgentCard ↔ MCP tools/list coverage ✅` : `## AgentCard ↔ MCP tools/list coverage ❌`);
  lines.push(``);
  lines.push(`**Declared:** ${report.declared} · **Available:** ${report.available} · **Matched:** ${report.matched.length}`);
  lines.push(``);

  if (report.missing.length > 0) {
    lines.push(`### Missing (declared in card but not exposed by server)`);
    for (const t of report.missing) lines.push(`- \`${t.name}\` (side_effects: ${t.side_effects})`);
    lines.push(``);
  }
  if (report.undeclared.length > 0) {
    lines.push(`### Undeclared (exposed by server but not in card)`);
    for (const t of report.undeclared) lines.push(`- \`${t.name}\``);
    lines.push(``);
  }

  lines.push(`### Declared by side-effect class`);
  lines.push(``);
  lines.push(`| read | mutating | external | destructive |`);
  lines.push(`|---:|---:|---:|---:|`);
  lines.push(
    `| ${SIDE_EFFECTS.map((s) => report.declaredBySideEffect[s]).join(" | ")} |`
  );

  return lines.join("\n");
}

/** One-line summary suitable for CI logs. */
export function toSummary(report: CoverageReport): string {
  const status = report.conformant ? "ok" : "fail";
  return `${status} — ${report.matched.length}/${report.declared} matched, ${report.missing.length} missing, ${report.undeclared.length} undeclared`;
}
