import { BANK } from "../../src/data/questions";

/**
 * Guards against the "length tell": if the correct answer is reliably the longest
 * or most-detailed option, it is guessable without reading the question. The real
 * exam balances option lengths, so distractors must be comparably full and the
 * correct answer must not dwarf them.
 */
const stats = BANK.map((q) => {
  const correct = q.choices.find((c) => c.c === true);
  if (!correct) throw new Error(`no correct choice in ${q.id}`);
  const distractors = q.choices.filter((c) => c.c !== true);
  const avgDistractor = distractors.reduce((sum, c) => sum + c.t.length, 0) / distractors.length;
  const maxDistractor = Math.max(...distractors.map((c) => c.t.length));
  return {
    id: q.id,
    correctLen: correct.t.length,
    avgDistractor,
    correctStrictlyLongest: correct.t.length > maxDistractor,
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

  it("has no question whose correct answer dwarfs its distractors (> 1.5× the longest distractor)", () => {
    const offenders = stats.filter((l) => l.ratioToLongestDistractor > 1.5).map((l) => l.id);
    expect(offenders).toEqual([]);
  });
});
