import { canSubmit, choiceState, showSubmitButton, squareStatus } from "../../src/lib/choice-state";

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

describe("choiceState with a pending pick", () => {
  it("marks the pending pick as selected", () => {
    expect(choiceState({ correctKey: CORRECT, pending: "A" }, "A")).toBe("selected");
  });

  it("leaves the other choices idle", () => {
    expect(choiceState({ correctKey: CORRECT, pending: "A" }, "C")).toBe("idle");
  });

  it("drops the selected state once the answer is committed", () => {
    const ctx = {
      correctKey: CORRECT,
      pending: "A",
      answer: { selected: "A", correct: false },
    };
    expect(choiceState(ctx, "A")).toBe("incorrect");
  });

  it("does not reveal which pick was right", () => {
    const keys = ["A", "B", "C", "D"];
    const withB = keys.map((k) => choiceState({ correctKey: "B", pending: "A" }, k));
    const withD = keys.map((k) => choiceState({ correctKey: "D", pending: "A" }, k));
    expect(withB).toEqual(withD);
  });
});

describe("canSubmit", () => {
  it("cannot submit with nothing picked", () => {
    expect(canSubmit({ correctKey: CORRECT })).toBe(false);
  });
  it("can submit a pending pick", () => {
    expect(canSubmit({ correctKey: CORRECT, pending: "A" })).toBe(true);
  });
  it("cannot submit a question already answered", () => {
    const answer = { selected: "A", correct: false };
    expect(canSubmit({ correctKey: CORRECT, pending: "A", answer })).toBe(false);
  });
});

describe("showSubmitButton", () => {
  it("shows in submit mode before anything is picked", () => {
    expect(showSubmitButton("submit", { correctKey: CORRECT })).toBe(true);
  });
  it("hides in instant mode with nothing pending", () => {
    expect(showSubmitButton("instant", { correctKey: CORRECT })).toBe(false);
  });
  it("still shows in instant mode when a pick was left pending by a mode switch", () => {
    expect(showSubmitButton("instant", { correctKey: CORRECT, pending: "A" })).toBe(true);
  });
  it("hides once the question is answered, in either mode", () => {
    const answer = { selected: "A", correct: false };
    expect(showSubmitButton("submit", { correctKey: CORRECT, answer })).toBe(false);
    expect(showSubmitButton("instant", { correctKey: CORRECT, answer })).toBe(false);
  });
});

describe("squareStatus", () => {
  it("is unanswered when there is no record", () => {
    expect(squareStatus(undefined)).toBe("unanswered");
  });
  it("is selected for a pending, unsubmitted pick", () => {
    expect(squareStatus(undefined, "A")).toBe("selected");
  });
  it("is correct for a right answer", () => {
    expect(squareStatus({ selected: "B", correct: true })).toBe("correct");
  });
  it("is incorrect for a wrong answer", () => {
    expect(squareStatus({ selected: "A", correct: false })).toBe("incorrect");
  });
  it("prefers a committed answer over a stale pending pick", () => {
    expect(squareStatus({ selected: "B", correct: true }, "A")).toBe("correct");
  });
});
