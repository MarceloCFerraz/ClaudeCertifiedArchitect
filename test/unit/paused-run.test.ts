import { answeredCount, toPausedRun } from "../../src/lib/paused-run";
import type { ExamState, PreparedQuestion, Session } from "../../src/lib/types";

const T0 = 1_700_000_000_000;

function pq(id: string): PreparedQuestion {
  return {
    id,
    s: 1,
    d: 1,
    ts: "1.1",
    q: `Stem for ${id}`,
    choices: [
      { t: "Right", c: true, k: "A" },
      { t: "Wrong", k: "B" },
      { t: "Wrong too", k: "C" },
      { t: "Also wrong", k: "D" },
    ],
    correctKey: "A",
    exp: "Because.",
  };
}

const session: Session = {
  label: "Balanced exam (2 questions)",
  fileType: "balanced-2q",
  count: 2,
  createdAt: T0,
  timed: false,
};

function examState(over: Partial<ExamState> = {}): ExamState {
  return {
    screen: "exam",
    config: { mode: "balanced", length: 2 },
    seed: 42,
    session,
    questions: [pq("S1Q1"), pq("S1Q2")],
    idx: 1,
    answers: { S1Q1: { selected: "A", correct: true } },
    eliminations: {},
    timed: false,
    elapsedSeconds: 0,
    remainingSeconds: 0,
    runningSince: T0,
    ...over,
  };
}

describe("toPausedRun", () => {
  it("keeps the exact draw, position and answers", () => {
    const exam = examState();
    const run = toPausedRun(exam, T0 + 60_000);
    expect(run?.questions).toBe(exam.questions);
    expect(run?.idx).toBe(1);
    expect(run?.answers).toEqual({ S1Q1: { selected: "A", correct: true } });
  });

  it("carries the crossed-out choices into the parked run", () => {
    const run = toPausedRun(examState({ eliminations: { S1Q2: ["B", "D"] } }), T0 + 60_000);
    expect(run?.eliminations).toEqual({ S1Q2: ["B", "D"] });
  });

  it("derives an id that survives a pause, resume and second pause", () => {
    const first = toPausedRun(examState(), T0 + 60_000);
    const second = toPausedRun(examState({ idx: 0 }), T0 + 900_000);
    expect(first?.id).toBe("balanced-2q-1700000000000");
    expect(second?.id).toBe(first?.id);
  });

  it("stops the clock, banking the time spent so far", () => {
    const run = toPausedRun(examState({ elapsedSeconds: 30 }), T0 + 60_000);
    expect(run?.elapsedSeconds).toBe(90);
    expect(run?.runningSince).toBeNull();
  });

  it("freezes the remaining budget of a timed run", () => {
    const timed = examState({ timed: true, remainingSeconds: 600 });
    expect(toPausedRun(timed, T0 + 60_000)?.remainingSeconds).toBe(540);
  });

  it("stamps when it was paused", () => {
    expect(toPausedRun(examState(), T0 + 60_000)?.pausedAt).toBe(T0 + 60_000);
  });

  it("parks a run nobody has answered yet — the draw alone is worth keeping", () => {
    const untouched = examState({ idx: 0, answers: {} });
    expect(toPausedRun(untouched, T0)?.questions).toHaveLength(2);
  });

  it("returns null for a finished run", () => {
    expect(toPausedRun(examState({ screen: "results" }), T0)).toBeNull();
  });

  it("returns null when no run has been started", () => {
    expect(toPausedRun(examState({ screen: "home", config: null, session: null }), T0)).toBeNull();
  });

  it("returns null when the draw is empty", () => {
    expect(toPausedRun(examState({ questions: [] }), T0)).toBeNull();
  });
});

describe("answeredCount", () => {
  it("counts the questions answered so far", () => {
    expect(answeredCount({ S1Q1: { selected: "A", correct: true } })).toBe(1);
  });

  it("is zero for an untouched run", () => {
    expect(answeredCount({})).toBe(0);
  });
});
