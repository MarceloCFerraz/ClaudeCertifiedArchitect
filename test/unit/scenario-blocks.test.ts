import { scenarioBlocks } from "../../src/lib/scenario-blocks";
import type { PreparedQuestion } from "../../src/lib/types";

function pq(id: string, s: number): PreparedQuestion {
  return {
    id,
    s,
    d: 1,
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

function makeQuestions(scenarioOrder: number[]): PreparedQuestion[] {
  return scenarioOrder.map((s, i) => pq(`q${i}`, s));
}

describe("scenarioBlocks", () => {
  it("groups a single scenario into one block carrying global indices", () => {
    const questions = makeQuestions([1, 1, 1]);
    const blocks = scenarioBlocks(questions);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].s).toBe(1);
    expect(blocks[0].questions.map((item) => item.index)).toEqual([0, 1, 2]);
  });

  it("splits multiple contiguous scenarios into blocks with the right sizes", () => {
    const blocks = scenarioBlocks(makeQuestions([1, 1, 2, 2, 2, 3]));
    expect(blocks.map((b) => b.s)).toEqual([1, 2, 3]);
    expect(blocks.map((b) => b.questions.length)).toEqual([2, 3, 1]);
  });

  it("preserves encounter order when scenario numbers are not ascending", () => {
    const blocks = scenarioBlocks(makeQuestions([3, 3, 1, 1, 1, 5]));
    expect(blocks.map((b) => b.s)).toEqual([3, 1, 5]);
    expect(blocks.map((b) => b.questions.length)).toEqual([2, 3, 1]);
  });

  it("numbers questions 1-based within each block, resetting per block", () => {
    const blocks = scenarioBlocks(makeQuestions([3, 3, 1, 1, 1]));
    const displayNumbers = blocks.map((b) => b.questions.map((_item, pos) => pos + 1));
    expect(displayNumbers).toEqual([
      [1, 2],
      [1, 2, 3],
    ]);
  });

  it("maps each item index back to the same question object", () => {
    const questions = makeQuestions([2, 2, 1]);
    const blocks = scenarioBlocks(questions);
    for (const block of blocks) {
      for (const item of block.questions) {
        expect(item.q).toBe(questions[item.index]);
      }
    }
  });

  it("returns an empty array for no questions", () => {
    expect(scenarioBlocks([])).toEqual([]);
  });
});
