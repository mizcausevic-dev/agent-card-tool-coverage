import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { coverage } from "../src/coverage.js";
import { toMarkdown, toSummary } from "../src/format.js";
import type { AgentCard, McpToolsListResult } from "../src/types.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const card = (name: string): AgentCard =>
  JSON.parse(readFileSync(`${here}/../fixtures/${name}`, "utf8")) as AgentCard;
const list = (name: string): McpToolsListResult =>
  JSON.parse(readFileSync(`${here}/../fixtures/${name}`, "utf8")) as McpToolsListResult;

describe("coverage", () => {
  it("returns matched + missing + undeclared for a drift fixture", () => {
    const r = coverage(card("card.json"), list("tools-list.json"));
    expect(r.declared).toBe(4);
    expect(r.available).toBe(3);
    expect(r.matched.map((m) => m.name).sort()).toEqual(["search-vectorstore", "summarize"]);
    expect(r.missing.map((t) => t.name).sort()).toEqual(["cite-passage", "send-email"]);
    expect(r.undeclared.map((t) => t.name).sort()).toEqual(["delete-document"]);
    expect(r.conformant).toBe(false);
  });

  it("returns conformant=true when every declared tool is exposed", () => {
    const r = coverage(card("card.json"), list("tools-list-conformant.json"));
    expect(r.conformant).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.matched).toHaveLength(4);
  });

  it("strict mode also fails on undeclared tools", () => {
    const fullList: McpToolsListResult = {
      tools: [
        ...list("tools-list-conformant.json").tools,
        { name: "secret-debug-tool", description: "" }
      ]
    };
    const r = coverage(card("card.json"), fullList, { strict: true });
    expect(r.missing).toHaveLength(0);
    expect(r.undeclared.map((t) => t.name)).toEqual(["secret-debug-tool"]);
    expect(r.conformant).toBe(false);
  });

  it("case-insensitive matches Search-Vectorstore vs search-vectorstore", () => {
    const skewed: McpToolsListResult = {
      tools: list("tools-list-conformant.json").tools.map((t) =>
        t.name === "search-vectorstore" ? { ...t, name: "Search-Vectorstore" } : t
      )
    };
    expect(coverage(card("card.json"), skewed).matched.length).toBe(3);
    expect(coverage(card("card.json"), skewed, { caseInsensitive: true }).matched.length).toBe(4);
  });

  it("counts declared tools by side-effect class", () => {
    const r = coverage(card("card.json"), list("tools-list.json"));
    expect(r.declaredBySideEffect.read).toBe(3);
    expect(r.declaredBySideEffect.external).toBe(1);
    expect(r.declaredBySideEffect.mutating).toBe(0);
    expect(r.declaredBySideEffect.destructive).toBe(0);
  });

  it("treats a card with no tools array as 0 declared", () => {
    const empty: AgentCard = { capabilities: {} };
    const r = coverage(empty, list("tools-list.json"));
    expect(r.declared).toBe(0);
    expect(r.missing).toEqual([]);
    expect(r.undeclared.length).toBe(3);
    expect(r.conformant).toBe(true);
  });

  it("throws on missing capabilities or tools array", () => {
    expect(() => coverage(null as unknown as AgentCard, list("tools-list.json"))).toThrow();
    expect(() => coverage(card("card.json"), {} as McpToolsListResult)).toThrow();
  });
});

describe("formatters", () => {
  it("toMarkdown renders ✅ when conformant, ❌ otherwise", () => {
    const okMd = toMarkdown(coverage(card("card.json"), list("tools-list-conformant.json")));
    expect(okMd).toContain("✅");

    const failMd = toMarkdown(coverage(card("card.json"), list("tools-list.json")));
    expect(failMd).toContain("❌");
    expect(failMd).toContain("Missing");
    expect(failMd).toContain("Undeclared");
    expect(failMd).toContain("cite-passage");
    expect(failMd).toContain("delete-document");
  });

  it("toSummary emits ok/fail with counts", () => {
    expect(toSummary(coverage(card("card.json"), list("tools-list-conformant.json")))).toMatch(
      /^ok — 4\/4 matched/
    );
    expect(toSummary(coverage(card("card.json"), list("tools-list.json")))).toMatch(
      /^fail — 2\/4 matched, 2 missing, 1 undeclared$/
    );
  });
});
