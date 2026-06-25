export interface Domain {
  name: string;
  weight: number;
}

export const DOMAINS: Record<number, Domain> = {
  "1": {
    name: "Agentic Architecture & Orchestration",
    weight: 27,
  },
  "2": {
    name: "Tool Design & MCP Integration",
    weight: 18,
  },
  "3": {
    name: "Claude Code Configuration & Workflows",
    weight: 20,
  },
  "4": {
    name: "Prompt Engineering & Structured Output",
    weight: 20,
  },
  "5": {
    name: "Context Management & Reliability",
    weight: 15,
  },
};
