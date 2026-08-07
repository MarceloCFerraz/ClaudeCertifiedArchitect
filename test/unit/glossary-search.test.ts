import type { GlossaryEntry } from "../../src/data/schema";
import {
  ALPHABET,
  filterEntries,
  groupByLetter,
  initialLetter,
  matchesQuery,
} from "../../src/lib/glossary-search";

const entry = (over: Partial<GlossaryEntry> = {}): GlossaryEntry => ({
  term: "Subagent",
  def: "A separate agent spawned for one scoped task.",
  ...over,
});

describe("ALPHABET", () => {
  it("lists the twenty-six letters in order", () => {
    expect(ALPHABET.length).toBe(26);
    expect(ALPHABET[0]).toBe("A");
    expect(ALPHABET[25]).toBe("Z");
  });
});

describe("initialLetter", () => {
  it("uppercases a term that starts lowercase", () => {
    expect(initialLetter("tool_use")).toBe("T");
  });

  it("leaves an already-uppercase initial alone", () => {
    expect(initialLetter("MCP")).toBe("M");
  });
});

describe("matchesQuery", () => {
  it("matches on the term, ignoring case", () => {
    expect(matchesQuery(entry({ term: "MCP" }), "mcp")).toBe(true);
  });

  it("matches on an alias", () => {
    expect(matchesQuery(entry({ term: "MCP", also: ["Model Context Protocol"] }), "protocol")).toBe(
      true,
    );
  });

  it("matches on text inside the definition", () => {
    expect(matchesQuery(entry({ def: "Spawned for one scoped task." }), "scoped")).toBe(true);
  });

  it("matches on text inside the long form", () => {
    expect(matchesQuery(entry({ more: "Arranged hub-and-spoke." }), "hub-and-spoke")).toBe(true);
  });

  it("ignores whitespace around the query", () => {
    expect(matchesQuery(entry({ term: "MCP" }), "  mcp  ")).toBe(true);
  });

  it("matches every entry for a blank query", () => {
    expect(matchesQuery(entry(), "")).toBe(true);
    expect(matchesQuery(entry(), "   ")).toBe(true);
  });

  it("rejects a query that appears nowhere in the entry", () => {
    expect(matchesQuery(entry(), "kubernetes")).toBe(false);
  });
});

describe("filterEntries", () => {
  const entries = [entry({ term: "MCP" }), entry({ term: "Token" }), entry({ term: "Subagent" })];

  it("returns every entry for a blank query", () => {
    expect(filterEntries(entries, "")).toEqual(entries);
  });

  it("preserves the input order of the entries it keeps", () => {
    const kept = filterEntries(entries, "agent").map((e) => e.term);
    expect(kept).toEqual(["MCP", "Token", "Subagent"]);
  });

  it("returns nothing when no entry matches", () => {
    expect(filterEntries(entries, "kubernetes")).toEqual([]);
  });
});

describe("groupByLetter", () => {
  it("groups entries under their initial letter in A to Z order", () => {
    const groups = groupByLetter([
      entry({ term: "Token" }),
      entry({ term: "Agentic loop" }),
      entry({ term: "MCP" }),
    ]);
    expect(groups.map((g) => g.letter)).toEqual(["A", "M", "T"]);
  });

  it("sorts entries within a group, ignoring case", () => {
    const groups = groupByLetter([
      entry({ term: "Token" }),
      entry({ term: "temperature" }),
      entry({ term: "Task tool" }),
    ]);
    expect(groups[0]?.entries.map((e) => e.term)).toEqual(["Task tool", "temperature", "Token"]);
  });

  it("omits letters that no entry landed on", () => {
    const groups = groupByLetter([entry({ term: "MCP" })]);
    expect(groups.map((g) => g.letter)).toEqual(["M"]);
  });

  it("returns no groups for no entries", () => {
    expect(groupByLetter([])).toEqual([]);
  });
});
