import { createExamSession, SECONDS_PER_QUESTION } from "../../src/lib/session";

describe("createExamSession timing", () => {
  it("always times the full mock at 2 min/question", () => {
    const made = createExamSession({ mode: "mock" });
    expect(made.questions).toHaveLength(60);
    expect(made.timed).toBe(true);
    expect(made.remaining).toBe(60 * SECONDS_PER_QUESTION);
  });

  it("leaves non-mock modes untimed by default", () => {
    const made = createExamSession({ mode: "balanced", length: 12 });
    expect(made.timed).toBe(false);
    expect(made.remaining).toBe(0);
  });

  it("times a non-mock mode when opted in, at 2 min/question", () => {
    const made = createExamSession({ mode: "balanced", length: 12, timed: true });
    expect(made.timed).toBe(true);
    expect(made.remaining).toBe(12 * SECONDS_PER_QUESTION);
    expect(made.session.timed).toBe(true);
  });

  it("carries a seed for deterministic resume", () => {
    const made = createExamSession({ mode: "domain", domain: 2 });
    expect(typeof made.seed).toBe("number");
  });
});
