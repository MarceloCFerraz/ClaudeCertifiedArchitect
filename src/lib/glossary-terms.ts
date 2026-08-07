import type { GlossaryEntry } from "../data/schema";

/** Hard ceiling on underlines in one block of prose, however long it is. */
export const MAX_ANNOTATIONS = 5;

/** Prose is also rationed by length: roughly one underline per this many characters.
    A flat count is the wrong shape, because what makes a paragraph read as stripes is
    density, not total. The bank's densest explanation is 193 characters long and wants
    seven terms — five of them would still be a stripe every four words. */
export const CHARS_PER_ANNOTATION = 55;

/** Budget for a block that is an inventory of concepts rather than prose making an
    argument — a scenario blurb, a domain description. Rationing those is wrong: the text
    is already a list of jargon, so marking half of it just picks arbitrary winners, and
    the whole point of the framing is to unpack the vocabulary before the questions do. */
export const ANNOTATE_ALL = Number.POSITIVE_INFINITY;

/** How many terms may be underlined in a block of the given length. Always allows one:
    a single underline is never noise, however short the sentence. */
export function annotationBudget(textLength: number): number {
  return Math.min(MAX_ANNOTATIONS, Math.max(1, Math.floor(textLength / CHARS_PER_ANNOTATION)));
}

export interface TermIndex {
  /** Lowercased match surface → the entry that owns it. */
  bySurface: Map<string, GlossaryEntry>;
  /** One alternation over every surface, longest first. Safe to share between calls:
      `matchAll` works on a clone, so `lastIndex` never leaks. */
  pattern: RegExp;
}

export type TextRun =
  | { kind: "plain"; text: string }
  | { kind: "term"; text: string; entry: GlossaryEntry };

const RE_META = /[.*+?^${}()|[\]\\]/g;

/** Every string an entry may be matched by in prose: the term itself plus its aliases. */
export function surfacesOf(entry: GlossaryEntry): string[] {
  return [entry.term, ...(entry.also ?? [])];
}

export function buildTermIndex(entries: GlossaryEntry[]): TermIndex {
  const bySurface = new Map<string, GlossaryEntry>();
  for (const entry of entries) {
    if (entry.annotate === false) continue;
    for (const surface of surfacesOf(entry)) bySurface.set(surface.toLowerCase(), entry);
  }
  /* JS alternation is leftmost-*first*, not leftmost-longest, so this ordering is the
     entire mechanism that makes "context window" win over "context" at the same
     position. Ties break alphabetically so the compiled pattern is stable across runs. */
  const alternatives = [...bySurface.keys()]
    .sort((a, b) => b.length - a.length || (a < b ? -1 : 1))
    .map((surface) => surface.replace(RE_META, "\\$&"));
  /* The leading group *consumes* the boundary character instead of asserting it with a
     lookbehind: an unsupported lookbehind throws at construction, which would take the
     whole bundle down rather than just the glossary. The trailing side is a plain
     negative lookahead, which is universal. `\b` is no help either way — its
     underscore-is-a-word-character rule is what we want inside `tool_use` but not
     always outside it. `(es|s)?` covers regular plurals so eighty entries do not each
     have to author one; irregular forms go in `also`. An empty alternation would
     compile to `()` and match at every position, so the empty index gets `(?!)`. */
  const source = alternatives.length
    ? `(^|[^A-Za-z0-9_])(${alternatives.join("|")})(es|s)?(?![A-Za-z0-9_])`
    : "(?!)";
  return { bySurface, pattern: new RegExp(source, "gi") };
}

/** Segment prose into plain runs and term runs, marking only the first mention of each
    term and stopping at `max`. Matched text is kept verbatim, so "Subagents" stays
    "Subagents" on screen while resolving to the "Subagent" entry.

    Because matches are taken in reading order, what survives the budget is whatever the
    text introduces first — which in these explanations is the concept being taught,
    ahead of the closing list of why the other options are wrong. */
export function annotate(
  text: string,
  index: TermIndex,
  max = annotationBudget(text.length),
): TextRun[] {
  const runs: TextRun[] = [];
  const marked = new Set<string>();
  let cursor = 0;
  for (const match of text.matchAll(index.pattern)) {
    if (marked.size >= max) break;
    const [, before, surface, suffix] = match;
    const entry = index.bySurface.get(surface.toLowerCase());
    // Dedupe on the entry, not the surface, so a term, its plural and its aliases
    // collectively count as one mention rather than three.
    if (!entry || marked.has(entry.term)) continue;
    const start = match.index + before.length;
    const end = start + surface.length + (suffix ? suffix.length : 0);
    if (start > cursor) runs.push({ kind: "plain", text: text.slice(cursor, start) });
    runs.push({ kind: "term", text: text.slice(start, end), entry });
    marked.add(entry.term);
    cursor = end;
  }
  if (cursor < text.length) runs.push({ kind: "plain", text: text.slice(cursor) });
  return runs;
}
