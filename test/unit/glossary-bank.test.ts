import { GLOSSARY } from "../../src/data/glossary";
import { DEF_MAX_CHARS, glossarySchema } from "../../src/data/schema";

/** Every string an entry can be matched or searched by. Mirrors `surfacesOf` in
    src/lib/glossary-terms.ts, which cannot be imported here without coupling the
    content test to the matcher. */
const surfaces = (entry: (typeof GLOSSARY)[number]) => [entry.term, ...(entry.also ?? [])];

/* Code-unit order rather than localeCompare: the collation localeCompare picks depends
   on the host's default locale, and this assertion has to mean the same thing on CI. */
const byTerm = (a: string, b: string) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1);

describe("glossary schema", () => {
  it("validates every entry against the Zod schema", () => {
    const result = glossarySchema.safeParse(GLOSSARY);
    expect(result.success).toBe(true);
  });
});

describe("glossary integrity", () => {
  it("retains at least the baseline number of terms", () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(70);
  });

  it("has unique terms, ignoring case", () => {
    const terms = GLOSSARY.map((e) => e.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
  });

  it("never lets two entries claim the same match surface", () => {
    const owners = new Map<string, string>();
    const offenders: string[] = [];
    for (const entry of GLOSSARY) {
      for (const surface of surfaces(entry)) {
        const key = surface.toLowerCase();
        const owner = owners.get(key);
        if (owner) offenders.push(`"${surface}" claimed by ${owner} and ${entry.term}`);
        owners.set(key, entry.term);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("never repeats an entry's own term in its aliases", () => {
    const offenders = GLOSSARY.filter((e) =>
      (e.also ?? []).some((alias) => alias.toLowerCase() === e.term.toLowerCase()),
    ).map((e) => e.term);
    expect(offenders).toEqual([]);
  });

  /* The tooltip renders `def` and nothing else, and its height is estimated from a
     constant rather than measured — so the cap is what keeps the estimate honest. */
  it("keeps every definition within the tooltip character cap", () => {
    const offenders = GLOSSARY.filter((e) => e.def.length > DEF_MAX_CHARS).map(
      (e) => `${e.term} (${e.def.length})`,
    );
    expect(offenders).toEqual([]);
  });

  it("keeps every definition to a single sentence", () => {
    const offenders = GLOSSARY.filter((e) => /\.\s+[A-Z]/.test(e.def)).map((e) => e.term);
    expect(offenders).toEqual([]);
  });

  /* The browse UI buckets by initial letter, so a term starting with punctuation or a
     digit would exist in the glossary but be unreachable from the A–Z row. */
  it("starts every term with a letter", () => {
    const offenders = GLOSSARY.filter((e) => !/^[A-Za-z]/.test(e.term)).map((e) => e.term);
    expect(offenders).toEqual([]);
  });

  it("lists entries alphabetically by term", () => {
    const terms = GLOSSARY.map((e) => e.term);
    expect(terms).toEqual([...terms].sort(byTerm));
  });
});
