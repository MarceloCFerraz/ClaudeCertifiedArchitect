import { elapsedAt, foldClock, remainingAt } from "../../src/lib/exam-clock";
import type { ExamClock } from "../../src/lib/types";

const T0 = 1_700_000_000_000;

function clock(over: Partial<ExamClock> = {}): ExamClock {
  return { timed: false, elapsedSeconds: 0, remainingSeconds: 0, runningSince: T0, ...over };
}

describe("elapsedAt", () => {
  it("counts the segment currently in flight", () => {
    expect(elapsedAt(clock(), T0 + 90_000)).toBe(90);
  });

  it("adds banked segments to the one in flight", () => {
    expect(elapsedAt(clock({ elapsedSeconds: 120 }), T0 + 30_000)).toBe(150);
  });

  it("ignores wall time while the clock is stopped", () => {
    expect(elapsedAt(clock({ elapsedSeconds: 120, runningSince: null }), T0 + 999_000)).toBe(120);
  });

  it("never counts backwards when the clock starts in the future", () => {
    expect(elapsedAt(clock(), T0 - 5_000)).toBe(0);
  });
});

describe("remainingAt", () => {
  it("burns the budget as the segment runs", () => {
    expect(remainingAt(clock({ timed: true, remainingSeconds: 600 }), T0 + 60_000)).toBe(540);
  });

  it("floors at zero once the budget is spent", () => {
    expect(remainingAt(clock({ timed: true, remainingSeconds: 30 }), T0 + 90_000)).toBe(0);
  });

  it("holds the budget while the clock is stopped", () => {
    const parked = clock({ timed: true, remainingSeconds: 600, runningSince: null });
    expect(remainingAt(parked, T0 + 999_000)).toBe(600);
  });

  it("reports no budget for an untimed run", () => {
    expect(remainingAt(clock({ remainingSeconds: 600 }), T0 + 60_000)).toBe(0);
  });
});

describe("foldClock", () => {
  it("banks the segment in flight and stops the clock", () => {
    const running = clock({ timed: true, elapsedSeconds: 10, remainingSeconds: 600 });
    expect(foldClock(running, T0 + 60_000)).toEqual({
      timed: true,
      elapsedSeconds: 70,
      remainingSeconds: 540,
      runningSince: null,
    });
  });

  it("leaves an already-stopped clock untouched", () => {
    const parked = clock({ timed: true, elapsedSeconds: 70, remainingSeconds: 540 });
    const stopped = foldClock(parked, T0 + 60_000);
    expect(foldClock(stopped, T0 + 999_000)).toEqual(stopped);
  });
});
