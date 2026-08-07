import { DOMAINS } from "../../src/data/domains";
import { GLOSSARY } from "../../src/data/glossary";
import { BANK } from "../../src/data/questions";
import { SCENARIOS } from "../../src/data/scenarios";
import {
  ANNOTATE_ALL,
  annotate,
  annotationBudget,
  buildTermIndex,
} from "../../src/lib/glossary-terms";

/**
 * The glossary and the question bank are authored independently, so nothing stops a new
 * term from firing all over the explanations. These assertions run the real matcher
 * over the real bank — they are what keeps the two in balance.
 */
const index = buildTermIndex(GLOSSARY);

const termRuns = (text: string, max?: number) =>
  annotate(text, index, max).filter((run) => run.kind === "term");

/* A drift tripwire, not a display limit: the budget already bounds what renders, so a
   term list that started matching common words would do no visible damage while quietly
   crowding better matches out of the budget. The bank's densest explanation wants seven
   today, so this fires on real drift rather than on one legitimately dense outlier. */
const MAX_MATCHES_WANTED = 8;

describe("glossary annotation over the question bank", () => {
  it("never wants to underline absurdly many terms in one explanation", () => {
    const offenders = BANK.map((q) => ({
      id: q.id,
      wanted: termRuns(q.exp, Number.POSITIVE_INFINITY).length,
    }))
      .filter((q) => q.wanted > MAX_MATCHES_WANTED)
      .map((q) => `${q.id} (${q.wanted})`);
    expect(offenders).toEqual([]);
  });

  it("keeps rendered underlines within each explanation's length budget", () => {
    const offenders = BANK.filter(
      (q) => termRuns(q.exp).length > annotationBudget(q.exp.length),
    ).map((q) => q.id);
    expect(offenders).toEqual([]);
  });

  it("leaves every explanation's text intact", () => {
    const offenders = BANK.filter(
      (q) =>
        annotate(q.exp, index)
          .map((run) => run.text)
          .join("") !== q.exp,
    ).map((q) => q.id);
    expect(offenders).toEqual([]);
  });

  /* Slack by design — it fires if the index breaks entirely, not if the term list
     drifts by an entry or two. */
  it("annotates well over half the explanations in the bank", () => {
    const bare = BANK.filter((q) => termRuns(q.exp).length === 0);
    expect(bare.length).toBeLessThan(BANK.length / 2);
  });
});

/**
 * The scenario blurbs and domain descriptions are the first prose a reader meets, and
 * they are inventories of jargon rather than arguments — so they annotate unrationed.
 * These assertions keep the glossary honest about covering that framing: it is the one
 * place where a missing term leaves someone stuck before they reach a question.
 */
describe("glossary annotation over the scenario and domain framing", () => {
  const framing = [
    ...Object.entries(SCENARIOS).map(([id, s]) => ({ id: `S${id}`, text: s.blurb })),
    ...Object.entries(DOMAINS).map(([id, d]) => ({ id: `D${id}`, text: d.description })),
  ];

  it("defines at least one term in every scenario blurb and domain description", () => {
    const bare = framing
      .filter((f) => termRuns(f.text, ANNOTATE_ALL).length === 0)
      .map((f) => f.id);
    expect(bare).toEqual([]);
  });

  it("leaves the framing text intact", () => {
    const offenders = framing
      .filter(
        (f) =>
          annotate(f.text, index, ANNOTATE_ALL)
            .map((run) => run.text)
            .join("") !== f.text,
      )
      .map((f) => f.id);
    expect(offenders).toEqual([]);
  });

  it("never wants to underline absurdly many terms in one block", () => {
    const offenders = framing
      .map((f) => ({ id: f.id, wanted: termRuns(f.text, ANNOTATE_ALL).length }))
      .filter((f) => f.wanted > MAX_MATCHES_WANTED)
      .map((f) => `${f.id} (${f.wanted})`);
    expect(offenders).toEqual([]);
  });
});
