import { summarizeHistory } from "../../src/lib/history-stats";
import type { Attempt } from "../../src/lib/types";

function attempt(over: Partial<Attempt>): Attempt {
  return {
    id: "x",
    mode: "balanced",
    label: "Balanced exam (24 questions)",
    date: 0,
    scaled: 800,
    passing: true,
    correct: 20,
    answered: 24,
    total: 24,
    elapsedSeconds: 600,
    perDomain: [],
    ...over,
  };
}

describe("summarizeHistory", () => {
  it("returns zeros for an empty history", () => {
    expect(summarizeHistory([])).toEqual({
      count: 0,
      averageScaled: 0,
      bestScaled: 0,
      averageElapsedSeconds: 0,
      passRate: 0,
    });
  });

  it("averages score and time and reports the best and pass rate", () => {
    const summary = summarizeHistory([
      attempt({ scaled: 700, passing: false, elapsedSeconds: 300 }),
      attempt({ scaled: 900, passing: true, elapsedSeconds: 700 }),
    ]);
    expect(summary.count).toBe(2);
    expect(summary.averageScaled).toBe(800);
    expect(summary.bestScaled).toBe(900);
    expect(summary.averageElapsedSeconds).toBe(500);
    expect(summary.passRate).toBe(0.5);
  });

  it("rounds the averages", () => {
    const summary = summarizeHistory([
      attempt({ scaled: 700, elapsedSeconds: 100 }),
      attempt({ scaled: 701, elapsedSeconds: 101 }),
    ]);
    expect(summary.averageScaled).toBe(701); // 700.5 → 701
    expect(summary.averageElapsedSeconds).toBe(101); // 100.5 → 101
  });
});
