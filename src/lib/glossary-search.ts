import type { GlossaryEntry } from "../data/schema";

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export interface LetterGroup {
  letter: string;
  entries: GlossaryEntry[];
}

/** The A–Z bucket a term belongs to. Terms always start with a letter — the content
    test enforces it — so every entry lands in exactly one bucket. */
export function initialLetter(term: string): string {
  return term.slice(0, 1).toUpperCase();
}

/** Substring match over everything a reader might plausibly type. `more` is included
    deliberately: phrases like "hub-and-spoke" belong in the long form, and leaving them
    unsearchable would send someone away empty-handed from a term that does define it. */
export function matchesQuery(entry: GlossaryEntry, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [entry.term, entry.def, entry.more ?? "", ...(entry.also ?? [])];
  return haystack.some((field) => field.toLowerCase().includes(needle));
}

export function filterEntries(entries: GlossaryEntry[], query: string): GlossaryEntry[] {
  return entries.filter((entry) => matchesQuery(entry, query));
}

/** Bucket entries under their initial letter, A→Z, dropping letters nothing landed on.
    Sorts within each group rather than trusting input order, so a filtered subset still
    reads alphabetically. */
export function groupByLetter(entries: GlossaryEntry[]): LetterGroup[] {
  const buckets = new Map<string, GlossaryEntry[]>();
  for (const entry of entries) {
    const letter = initialLetter(entry.term);
    const bucket = buckets.get(letter);
    if (bucket) bucket.push(entry);
    else buckets.set(letter, [entry]);
  }
  return ALPHABET.filter((letter) => buckets.has(letter)).map((letter) => ({
    letter,
    entries: (buckets.get(letter) ?? []).sort((a, b) =>
      a.term.toLowerCase() < b.term.toLowerCase() ? -1 : 1,
    ),
  }));
}
