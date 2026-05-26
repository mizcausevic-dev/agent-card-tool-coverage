// Conformance check between an A2A AgentCard (what the agent SAYS it uses)
// and an MCP tools/list snapshot (what the server EXPOSES).

export type SideEffectClass = "read" | "mutating" | "external" | "destructive";

export interface DeclaredTool {
  name: string;
  side_effects: SideEffectClass;
  mcp_tool_card_uri?: string;
  [key: string]: unknown;
}

export interface AgentCard {
  agent_card_version?: string;
  agent?: { id?: string; name?: string; [key: string]: unknown };
  capabilities: {
    tools?: DeclaredTool[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface McpToolsListResult {
  tools: McpTool[];
}

export interface MatchedTool {
  name: string;
  declared: DeclaredTool;
  available: McpTool;
}

export interface CoverageReport {
  declared: number;
  available: number;
  /** Tools declared in the AgentCard but not present in tools/list. */
  missing: DeclaredTool[];
  /** Tools present in tools/list but not declared in the AgentCard. */
  undeclared: McpTool[];
  matched: MatchedTool[];
  /** True iff every declared tool is present in tools/list. */
  conformant: boolean;
  /** Counts of declared tools by side-effect class. */
  declaredBySideEffect: Record<SideEffectClass, number>;
}

export interface CoverageOptions {
  /** When true, declared tools may be matched case-insensitively. Default false. */
  caseInsensitive?: boolean;
  /** When true, undeclared tools are also treated as a conformance failure. Default false. */
  strict?: boolean;
}
