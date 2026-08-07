import type { Question } from "../../src/data/schema";
import { detectDrift, hasDrift } from "../../src/lib/drift";
import { prepareQuestion } from "../../src/lib/exam-builder";
import { createRng } from "../../src/lib/rng";

function question(over: Partial<Question> = {}): Question {
  return {
    id: "S1Q1",
    s: 1,
    d: 1,
    ts: "1.1",
    q: "Which orchestration pattern fits the workload?",
    choices: [
      { t: "The correct pattern", c: true },
      { t: "A plausible distractor" },
      { t: "Another plausible distractor" },
      { t: "A third plausible distractor" },
    ],
    exp: "Because the workload fans out.",
    ...over,
  };
}

const drawn = (q: Question) => prepareQuestion(q, createRng(7));

describe("detectDrift", () => {
  it("reports no drift when the bank still matches the draw", () => {
    expect(detectDrift([drawn(question())], [question()])).toEqual({ removed: 0, changed: 0 });
  });

  it("ignores choice order, since the draw is shuffled", () => {
    const original = question();
    const reordered = question({ choices: [...original.choices].reverse() });
    expect(detectDrift([drawn(original)], [reordered])).toEqual({ removed: 0, changed: 0 });
  });

  it("counts a question dropped from the bank as removed", () => {
    expect(detectDrift([drawn(question())], [])).toEqual({ removed: 1, changed: 0 });
  });

  it("counts an edited stem as changed", () => {
    const edited = question({ q: "Which orchestration pattern fits this workload?" });
    expect(detectDrift([drawn(question())], [edited])).toEqual({ removed: 0, changed: 1 });
  });

  it("counts an edited explanation as changed", () => {
    const edited = question({ exp: "Because the workload is sequential." });
    expect(detectDrift([drawn(question())], [edited])).toEqual({ removed: 0, changed: 1 });
  });

  it("counts a rewritten choice as changed", () => {
    const original = question();
    const edited = question({
      choices: [original.choices[0], original.choices[1], original.choices[2], { t: "A new one" }],
    });
    expect(detectDrift([drawn(original)], [edited])).toEqual({ removed: 0, changed: 1 });
  });

  it("counts a moved correct answer as changed, even with identical choice text", () => {
    const moved = question({
      choices: [
        { t: "The correct pattern" },
        { t: "A plausible distractor", c: true },
        { t: "Another plausible distractor" },
        { t: "A third plausible distractor" },
      ],
    });
    expect(detectDrift([drawn(question())], [moved])).toEqual({ removed: 0, changed: 1 });
  });

  it("counts a reassigned domain as changed, since it skews the breakdown", () => {
    expect(detectDrift([drawn(question())], [question({ d: 3 })])).toEqual({
      removed: 0,
      changed: 1,
    });
  });

  it("tallies removals and edits across a draw", () => {
    const kept = question({ id: "S1Q1" });
    const gone = question({ id: "S1Q2" });
    const edited = question({ id: "S1Q3" });
    const draw = [drawn(kept), drawn(gone), drawn(edited)];
    const bank = [kept, question({ id: "S1Q3", exp: "Rewritten." })];
    expect(detectDrift(draw, bank)).toEqual({ removed: 1, changed: 1 });
  });
});

describe("hasDrift", () => {
  it("is false for a draw that still matches the bank", () => {
    expect(hasDrift({ removed: 0, changed: 0 })).toBe(false);
  });

  it("is true when anything was removed or edited", () => {
    expect(hasDrift({ removed: 1, changed: 0 })).toBe(true);
    expect(hasDrift({ removed: 0, changed: 1 })).toBe(true);
  });
});
