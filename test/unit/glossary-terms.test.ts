import type { GlossaryEntry } from "../../src/data/schema";
import {
  ANNOTATE_ALL,
  annotate,
  annotationBudget,
  buildTermIndex,
  CHARS_PER_ANNOTATION,
  MAX_ANNOTATIONS,
  surfacesOf,
} from "../../src/lib/glossary-terms";

const entry = (over: Partial<GlossaryEntry> = {}): GlossaryEntry => ({
  term: "Subagent",
  def: "A separate agent spawned for one scoped task.",
  ...over,
});

const index = (...entries: GlossaryEntry[]) => buildTermIndex(entries);

/** The runs a caller actually cares about: which entry was marked, and what text it
    covers on screen. */
const marks = (runs: ReturnType<typeof annotate>) =>
  runs
    .filter((r) => r.kind === "term")
    .map((r) => (r.kind === "term" ? [r.entry.term, r.text] : []));

describe("surfacesOf", () => {
  it("returns the term alone when there are no aliases", () => {
    expect(surfacesOf(entry())).toEqual(["Subagent"]);
  });

  it("returns the term followed by its aliases", () => {
    expect(surfacesOf(entry({ also: ["sub-agent"] }))).toEqual(["Subagent", "sub-agent"]);
  });
});

describe("buildTermIndex", () => {
  it("maps every surface of an entry, lowercased, to that entry", () => {
    const built = index(entry({ term: "MCP", also: ["Model Context Protocol"] }));
    expect(built.bySurface.get("mcp")?.term).toBe("MCP");
    expect(built.bySurface.get("model context protocol")?.term).toBe("MCP");
  });

  it("skips entries that opted out of in-text annotation", () => {
    const built = index(entry({ term: "Turn", annotate: false }), entry());
    expect(built.bySurface.has("turn")).toBe(false);
    expect(built.bySurface.has("subagent")).toBe(true);
  });

  it("compiles a pattern that matches nothing when no entry is annotatable", () => {
    const built = index(entry({ term: "Turn", annotate: false }));
    expect(annotate("a turn of the loop", built)).toEqual([
      { kind: "plain", text: "a turn of the loop" },
    ]);
  });

  it("orders longer surfaces before the shorter ones they contain", () => {
    const built = index(entry({ term: "Context" }), entry({ term: "Context window" }));
    const alternatives = built.pattern.source;
    expect(alternatives.indexOf("context window")).toBeLessThan(
      alternatives.lastIndexOf("context"),
    );
  });
});

describe("annotationBudget", () => {
  it("allows a single underline however short the text is", () => {
    expect(annotationBudget(0)).toBe(1);
    expect(annotationBudget(CHARS_PER_ANNOTATION - 1)).toBe(1);
  });

  it("grants one more underline per allowance of characters", () => {
    expect(annotationBudget(CHARS_PER_ANNOTATION * 3)).toBe(3);
  });

  it("never exceeds the hard ceiling however long the text is", () => {
    expect(annotationBudget(CHARS_PER_ANNOTATION * 100)).toBe(MAX_ANNOTATIONS);
  });

  it("is outranked by ANNOTATE_ALL, which never withholds a term", () => {
    expect(ANNOTATE_ALL).toBeGreaterThan(annotationBudget(Number.MAX_SAFE_INTEGER));
  });
});

describe("annotate", () => {
  const built = index(
    entry({ term: "Subagent", also: ["sub-agent"] }),
    entry({ term: "Context window" }),
    entry({ term: "Context budget" }),
    entry({ term: "Token" }),
    entry({ term: "Batch API" }),
    entry({ term: "CLAUDE.md" }),
    entry({ term: "few-shot" }),
    entry({ term: "tool_use" }),
    entry({ term: "MCP", also: ["Model Context Protocol"] }),
  );

  /* Matching behaviour is asserted with the budget lifted, or a short sample would be
     limited to one underline and a broken dedupe would still look correct. Budgeting
     itself is exercised separately below. */
  const all = (text: string) => annotate(text, built, Number.POSITIVE_INFINITY);

  it("returns no runs for empty text", () => {
    expect(all("")).toEqual([]);
  });

  it("returns a single plain run when nothing matches", () => {
    expect(all("nothing here at all")).toEqual([{ kind: "plain", text: "nothing here at all" }]);
  });

  it("reproduces the input exactly when the runs are rejoined", () => {
    const samples = [
      "A subagent has its own context window.",
      "CLAUDE.md, tool_use, and few-shot all matter.",
      "Subagent",
      "  leading and trailing  ",
    ];
    for (const text of samples) {
      expect(
        all(text)
          .map((r) => r.text)
          .join(""),
      ).toBe(text);
    }
  });

  it("marks a multi-word term rather than the shorter term inside it", () => {
    expect(marks(all("the context window fills up"))).toEqual([
      ["Context window", "context window"],
    ]);
  });

  it("resolves an alias to the entry that owns it", () => {
    expect(marks(all("the Model Context Protocol is open"))).toEqual([
      ["MCP", "Model Context Protocol"],
    ]);
  });

  it("keeps the matched casing and inflection in the run text", () => {
    expect(marks(all("Subagents run in parallel"))).toEqual([["Subagent", "Subagents"]]);
  });

  it("matches a regular plural and an -es plural", () => {
    expect(marks(all("two subagents"))).toEqual([["Subagent", "subagents"]]);
    expect(marks(all("many tokens"))).toEqual([["Token", "tokens"]]);
  });

  it("does not match inside a longer word", () => {
    expect(marks(all("the tokenizer sets max_tokens"))).toEqual([]);
  });

  it("does not match a derived form it was not given", () => {
    expect(marks(all("batching requests"))).toEqual([]);
  });

  it("marks a term sitting at the very start of the text", () => {
    expect(marks(all("Subagent context is isolated"))).toEqual([["Subagent", "Subagent"]]);
  });

  it("marks only the first mention of a term in one block", () => {
    expect(marks(all("a subagent talks to another subagent"))).toEqual([["Subagent", "subagent"]]);
  });

  it("counts an inflection and an alias as the same mention as the term", () => {
    expect(marks(all("a subagent, more subagents, one sub-agent"))).toEqual([
      ["Subagent", "subagent"],
    ]);
  });

  it("stops at the given cap and emits the rest as one plain run", () => {
    const text = "a subagent, a token, the context window, a Batch API call, and few-shot";
    const runs = annotate(text, built, 2);
    expect(marks(runs)).toEqual([
      ["Subagent", "subagent"],
      ["Token", "token"],
    ]);
    expect(runs.filter((r) => r.kind === "plain").at(-1)?.text).toBe(
      ", the context window, a Batch API call, and few-shot",
    );
  });

  it("rations underlines by text length when no cap is given", () => {
    const text = "a subagent, a token, the context window, a Batch API call, and few-shot";
    expect(annotationBudget(text.length)).toBe(1);
    expect(marks(annotate(text, built))).toEqual([["Subagent", "subagent"]]);
    expect(marks(all(text)).length).toBeGreaterThan(1);
  });

  it("returns identical runs on a second call with the same index", () => {
    const text = "a subagent and a token";
    expect(all(text)).toEqual(all(text));
  });

  it("matches a term containing a regex metacharacter literally", () => {
    expect(marks(all("see CLAUDE.md for standards"))).toEqual([["CLAUDE.md", "CLAUDE.md"]]);
    expect(marks(all("see CLAUDEXmd for standards"))).toEqual([]);
  });

  it("matches hyphenated and underscored terms", () => {
    expect(marks(all("use few-shot examples"))).toEqual([["few-shot", "few-shot"]]);
    expect(marks(all("emit a tool_use block"))).toEqual([["tool_use", "tool_use"]]);
  });

  it("matches case-insensitively", () => {
    expect(marks(all("an mcp server"))).toEqual([["MCP", "mcp"]]);
    expect(marks(all("an MCP server"))).toEqual([["MCP", "MCP"]]);
  });
});
