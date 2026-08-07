import type { ExamState } from "../../src/lib/types";
import { bootActions } from "../../src/store/boot";
import { examActions } from "../../src/store/exam-slice";
import type { RootState } from "../../src/store/index";

const T0 = 1_700_000_000_000;

function rootState(exam: Partial<ExamState> = {}): RootState {
  return {
    exam: {
      screen: "exam",
      config: { mode: "balanced", length: 2 },
      seed: 42,
      session: {
        label: "Balanced exam (2 questions)",
        fileType: "balanced-2q",
        count: 2,
        createdAt: T0,
        timed: false,
      },
      questions: [
        {
          id: "S1Q1",
          s: 1,
          d: 1,
          ts: "1.1",
          q: "Stem",
          choices: [{ t: "Right", c: true, k: "A" }],
          correctKey: "A",
          exp: "Because.",
        },
      ],
      idx: 0,
      answers: {},
      timed: false,
      elapsedSeconds: 0,
      remainingSeconds: 0,
      runningSince: T0,
      ...exam,
    },
    history: { attempts: [] },
    paused: { runs: [] },
  };
}

describe("bootActions", () => {
  it("does nothing when the app was left on the home screen", () => {
    expect(bootActions(rootState({ screen: "home" }), T0)).toEqual([]);
  });

  it("restarts the clock for a run left open, discarding the time the app was closed", () => {
    expect(bootActions(rootState(), T0 + 86_400_000)).toEqual([
      examActions.clockResumed(T0 + 86_400_000),
    ]);
  });

  it("leaves the clock alone on the results screen", () => {
    expect(bootActions(rootState({ screen: "results" }), T0)).toEqual([]);
  });

  it("clears a stored run that has no draw, which could never be rendered", () => {
    const stale = rootState({ screen: "exam", questions: [] });
    expect(bootActions(stale, T0)).toEqual([examActions.examCleared()]);
  });

  it("clears a stored results screen that has no draw", () => {
    const stale = rootState({ screen: "results", questions: [] });
    expect(bootActions(stale, T0)).toEqual([examActions.examCleared()]);
  });
});
