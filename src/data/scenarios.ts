export interface Scenario {
  title: string;
  blurb: string;
  domains: number[];
}

export const SCENARIOS: Record<number, Scenario> = {
  "1": {
    title: "Customer Support Resolution Agent",
    blurb:
      "An Agent SDK support agent handles returns, billing disputes, and account issues via custom MCP tools (get_customer, lookup_order, process_refund, escalate_to_human). Target: 80%+ first-contact resolution, while knowing when to escalate.",
    domains: [1, 2, 5],
  },
  "2": {
    title: "Code Generation with Claude Code",
    blurb:
      "A team uses Claude Code for generation, refactoring, debugging, and docs — integrated via custom slash commands and CLAUDE.md, weighing plan mode vs direct execution.",
    domains: [3, 5],
  },
  "3": {
    title: "Multi-Agent Research System",
    blurb:
      "A coordinator delegates to specialized subagents (web search, document analysis, synthesis, report generation) to produce comprehensive, cited reports.",
    domains: [1, 2, 5],
  },
  "4": {
    title: "Developer Productivity with Claude",
    blurb:
      "An agent helps engineers explore unfamiliar codebases and automate tasks using built-in tools (Read, Write, Bash, Grep, Glob) plus MCP servers.",
    domains: [2, 3, 1],
  },
  "5": {
    title: "Claude Code for Continuous Integration",
    blurb:
      "Claude Code runs in CI/CD: automated code reviews, test generation, and PR feedback. Prompts must be actionable and minimize false positives.",
    domains: [3, 4],
  },
  "6": {
    title: "Structured Data Extraction",
    blurb:
      "A system extracts information from unstructured documents, validates output against JSON schemas, handles edge cases gracefully, and integrates downstream.",
    domains: [4, 5],
  },
};
