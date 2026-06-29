export interface Domain {
  name: string;
  weight: number;
  description: string;
}

export const DOMAINS: Record<number, Domain> = {
  "1": {
    name: "Agentic Architecture & Orchestration",
    weight: 27,
    description:
      "Building agentic applications with the Agent SDK — agentic loops, multi-agent orchestration, subagent delegation, tool integration, and lifecycle hooks.",
  },
  "2": {
    name: "Tool Design & MCP Integration",
    weight: 18,
    description:
      "Designing Model Context Protocol (MCP) tool and resource interfaces for integrating Claude with backend systems.",
  },
  "3": {
    name: "Claude Code Configuration & Workflows",
    weight: 20,
    description:
      "Configuring and customizing Claude Code for team workflows — CLAUDE.md files, Agent Skills, MCP servers, and plan mode.",
  },
  "4": {
    name: "Prompt Engineering & Structured Output",
    weight: 20,
    description:
      "Engineering prompts that produce reliable structured output, using JSON schemas, few-shot examples, and extraction patterns.",
  },
  "5": {
    name: "Context Management & Reliability",
    weight: 15,
    description:
      "Managing context windows across long documents and multi-agent handoffs, plus escalation and reliability decisions — error handling, human-in-the-loop, and self-evaluation.",
  },
};
