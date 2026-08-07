import { choiceState, squareStatus } from "../../src/lib/choice-state";

const CORRECT = "B";

describe("choiceState", () => {
  it("is idle for every choice before the question is answered", () => {
    const ctx = { correctKey: CORRECT };
    expect(choiceState(ctx, "A")).toBe("idle");
    expect(choiceState(ctx, "B")).toBe("idle");
  });

  it("marks the correct choice once the question is answered", () => {
    const ctx = { correctKey: CORRECT, answer: { selected: "A", correct: false } };
    expect(choiceState(ctx, "B")).toBe("correct");
  });

  it("marks the chosen wrong choice as incorrect", () => {
    const ctx = { correctKey: CORRECT, answer: { selected: "A", correct: false } };
    expect(choiceState(ctx, "A")).toBe("incorrect");
  });

  it("dims the choices that were neither picked nor correct", () => {
    const ctx = { correctKey: CORRECT, answer: { selected: "A", correct: false } };
    expect(choiceState(ctx, "C")).toBe("dimmed");
    expect(choiceState(ctx, "D")).toBe("dimmed");
  });

  it("shows only the correct choice when the answer was right", () => {
    const ctx = { correctKey: CORRECT, answer: { selected: CORRECT, correct: true } };
    expect(choiceState(ctx, "B")).toBe("correct");
    expect(choiceState(ctx, "A")).toBe("dimmed");
  });

  it("never depends on the correct key before the answer is committed", () => {
    const keys = ["A", "B", "C", "D"];
    const withB = keys.map((k) => choiceState({ correctKey: "B", eliminated: ["A"] }, k));
    const withD = keys.map((k) => choiceState({ correctKey: "D", eliminated: ["A"] }, k));
    expect(withB).toEqual(withD);
  });

  it("marks a crossed-out choice as eliminated", () => {
    expect(choiceState({ correctKey: CORRECT, eliminated: ["C"] }, "C")).toBe("eliminated");
  });

  it("leaves the choices that were not crossed out alone", () => {
    expect(choiceState({ correctKey: CORRECT, eliminated: ["C"] }, "A")).toBe("idle");
  });

  it("lets the reveal win over a cross-out once the answer is in", () => {
    const ctx = {
      correctKey: CORRECT,
      eliminated: [CORRECT],
      answer: { selected: "A", correct: false },
    };
    expect(choiceState(ctx, CORRECT)).toBe("correct");
    expect(choiceState(ctx, "A")).toBe("incorrect");
  });
});

describe("squareStatus", () => {
  it("is unanswered when there is no record", () => {
    expect(squareStatus(undefined)).toBe("unanswered");
  });
  it("is correct for a right answer", () => {
    expect(squareStatus({ selected: "B", correct: true })).toBe("correct");
  });
  it("is incorrect for a wrong answer", () => {
    expect(squareStatus({ selected: "A", correct: false })).toBe("incorrect");
  });
});
