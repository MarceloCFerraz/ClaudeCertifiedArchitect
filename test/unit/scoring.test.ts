import { scoreExam } from "../../src/lib/scoring";
import type { Answers, PreparedQuestion } from "../../src/lib/types";

function q(id: string, d: number): PreparedQuestion {
  return {
    id,
    s: 1,
    d,
    ts: "1.1",
    q: "?",
    exp: "",
    correctKey: "A",
    choices: [
      { t: "a", k: "A", c: true },
      { t: "b", k: "B" },
      { t: "c", k: "C" },
      { t: "d", k: "D" },
    ],
  };
}

const right: Answers[string] = { selected: "A", correct: true };
const wrong: Answers[string] = { selected: "B", correct: false };

describe("scoreExam", () => {
  it("scores a perfect exam at the maximum (1000)", () => {
    const questions = [q("1", 1), q("2", 2)];
    const score = scoreExam(questions, { "1": right, "2": right });
    expect(score.scaled).toBe(1000);
    expect(score.passing).toBe(true);
  });

  it("scores an all-wrong exam at the floor (100)", () => {
    const questions = [q("1", 1), q("2", 2)];
    const score = scoreExam(questions, { "1": wrong, "2": wrong });
    expect(score.scaled).toBe(100);
    expect(score.passing).toBe(false);
  });

  it("scores an unattempted exam at the floor on the total basis", () => {
    const score = scoreExam([q("1", 1), q("2", 2)], {});
    expect(score.scaled).toBe(100);
    expect(score.answered).toBe(0);
  });

  it("weights domains by their blueprint weight, not flat", () => {
    // D1 (27%) correct, D5 (15%) wrong → weighted 27/42, not a flat 50%.
    const score = scoreExam([q("a", 1), q("b", 5)], { a: right, b: wrong });
    expect(score.scaled).toBe(679); // 100 + (27/42) * 900
    expect(score.scaled).not.toBe(550); // flat 50% would give 550
  });

  it("reduces to plain ratio for a single-domain drill", () => {
    // 3 of 4 correct in one domain → 100 + 0.75 * 900 = 775.
    const questions = [q("1", 3), q("2", 3), q("3", 3), q("4", 3)];
    const answers: Answers = { "1": right, "2": right, "3": right, "4": wrong };
    expect(scoreExam(questions, answers, "total").scaled).toBe(775);
  });

  it("differs between answered and total basis when questions are skipped", () => {
    const questions = [q("1", 1), q("2", 1)]; // one answered, one skipped
    const answers: Answers = { "1": right };
    expect(scoreExam(questions, answers, "answered").scaled).toBe(1000);
    expect(scoreExam(questions, answers, "total").scaled).toBe(550); // 100 + 0.5*900
  });

  it("reports per-domain tallies", () => {
    const questions = [q("1", 1), q("2", 1), q("3", 2)];
    const score = scoreExam(questions, { "1": right, "2": wrong, "3": right });
    const d1 = score.perDomain.find((p) => p.domain === 1);
    expect(d1).toMatchObject({ correct: 1, answered: 2, total: 2 });
  });
});
