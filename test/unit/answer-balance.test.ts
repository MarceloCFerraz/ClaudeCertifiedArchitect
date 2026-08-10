import { BANK } from "../../src/data/questions";

/**
 * Guards against the "length tell": if the correct answer is reliably the longest
 * or most-detailed option, it is guessable without reading the question. The real
 * exam balances option lengths, so distractors must be comparably full and the
 * correct answer must not dwarf them.
 *
 * The tell runs in both directions. Over-correcting for "correct answer is longest"
 * pushes the correct answer to the *shortest* slot instead, which is just as
 * guessable — "pick the shortest" beat chance across 45.6% of the bank before the
 * mirror rule below was added.
 */
const stats = BANK.map((q) => {
  const correct = q.choices.find((c) => c.c === true);
  if (!correct) throw new Error(`no correct choice in ${q.id}`);
  const distractors = q.choices.filter((c) => c.c !== true);
  const avgDistractor = distractors.reduce((sum, c) => sum + c.t.length, 0) / distractors.length;
  const maxDistractor = Math.max(...distractors.map((c) => c.t.length));
  const minDistractor = Math.min(...distractors.map((c) => c.t.length));
  return {
    id: q.id,
    correctLen: correct.t.length,
    avgDistractor,
    correctStrictlyLongest: correct.t.length > maxDistractor,
    correctStrictlyShortest: correct.t.length < minDistractor,
    ratioToLongestDistractor: correct.t.length / maxDistractor,
  };
});

describe("answer option length balance", () => {
  it("keeps distractors comparable in length to the correct answer (bank-wide ≥ 0.85)", () => {
    const totalCorrect = stats.reduce((s, l) => s + l.correctLen, 0);
    const totalDistractor = stats.reduce((s, l) => s + l.avgDistractor, 0);
    expect(totalDistractor / totalCorrect).toBeGreaterThanOrEqual(0.85);
  });

  it("does not make the correct answer the single longest option in most questions (≤ 50%)", () => {
    const share = stats.filter((l) => l.correctStrictlyLongest).length / stats.length;
    expect(share).toBeLessThanOrEqual(0.5);
  });

  it("does not make the correct answer the single shortest option in most questions (≤ 40%)", () => {
    const share = stats.filter((l) => l.correctStrictlyShortest).length / stats.length;
    expect(share).toBeLessThanOrEqual(0.4);
  });

  it("has no question whose correct answer dwarfs its distractors (> 1.5× the longest distractor)", () => {
    const offenders = stats.filter((l) => l.ratioToLongestDistractor > 1.5).map((l) => l.id);
    expect(offenders).toEqual([]);
  });
});
