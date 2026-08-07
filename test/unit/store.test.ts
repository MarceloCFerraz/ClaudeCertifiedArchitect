import { configureStore } from "@reduxjs/toolkit";
import examReducer, { examActions } from "../../src/store/exam-slice";
import historyReducer from "../../src/store/history-slice";
import pausedReducer, { MAX_PAUSED, pausedActions } from "../../src/store/paused-slice";
import {
  answerQuestion,
  finishExam,
  pauseExam,
  resumeRun,
  startExam,
} from "../../src/store/thunks";

const T0 = 1_700_000_000_000;

// A plain store without redux-persist (no browser/IndexedDB needed).
function makeStore() {
  return configureStore({
    reducer: { exam: examReducer, history: historyReducer, paused: pausedReducer },
  });
}

describe("exam store flow", () => {
  it("starts an exam with a seed and a full draw", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 12 }));
    const { exam } = store.getState();
    expect(exam.screen).toBe("exam");
    expect(exam.questions).toHaveLength(12);
    expect(exam.seed).not.toBeNull();
    expect(exam.idx).toBe(0);
  });

  it("locks an answer once recorded", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 12 }));
    const q = store.getState().exam.questions[0];
    store.dispatch(examActions.answered({ qid: q.id, selected: "A", correct: false }));
    store.dispatch(examActions.answered({ qid: q.id, selected: "B", correct: true }));
    expect(store.getState().exam.answers[q.id]).toEqual({ selected: "A", correct: false });
  });

  it("records a compact attempt in history on finish", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 12 }));
    const q = store.getState().exam.questions[0];
    store.dispatch(examActions.answered({ qid: q.id, selected: q.correctKey, correct: true }));
    store.dispatch(finishExam());

    const { exam, history } = store.getState();
    expect(exam.screen).toBe("results");
    expect(history.attempts).toHaveLength(1);
    expect(history.attempts[0]).toMatchObject({ mode: "balanced", answered: 1, correct: 1 });
    // compact: no question text stored
    expect(JSON.stringify(history.attempts[0])).not.toContain(q.q);
  });

  it("does not record an attempt when nothing was answered", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "domain", domain: 1 }));
    store.dispatch(finishExam());
    expect(store.getState().history.attempts).toHaveLength(0);
    expect(store.getState().exam.screen).toBe("results");
  });
});

describe("pausing and resuming", () => {
  it("moves the run out of the exam slice and back to the home screen", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 12 }));
    store.dispatch(pauseExam(T0));

    const { exam, paused } = store.getState();
    expect(paused.runs).toHaveLength(1);
    expect(exam.screen).toBe("home");
    expect(exam.config).toBeNull();
    expect(exam.questions).toHaveLength(0);
  });

  it("restores the identical draw, position and answers", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 24 }));
    const before = store.getState().exam;
    const q = before.questions[3];
    store.dispatch(examActions.answered({ qid: q.id, selected: q.correctKey, correct: true }));
    store.dispatch(examActions.navigatedTo(4));
    store.dispatch(pauseExam(T0));

    store.dispatch(resumeRun(store.getState().paused.runs[0].id, T0 + 1_000));

    const after = store.getState().exam;
    expect(after.screen).toBe("exam");
    expect(after.questions.map((x) => x.id)).toEqual(before.questions.map((x) => x.id));
    expect(after.questions.map((x) => x.correctKey)).toEqual(
      before.questions.map((x) => x.correctKey),
    );
    expect(after.idx).toBe(4);
    expect(after.answers[q.id]).toEqual({ selected: q.correctKey, correct: true });
  });

  it("takes the run off the paused list once resumed", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 12 }));
    store.dispatch(pauseExam(T0));
    store.dispatch(resumeRun(store.getState().paused.runs[0].id, T0 + 1_000));
    expect(store.getState().paused.runs).toHaveLength(0);
  });

  it("replaces the entry instead of cloning it when the same run is parked twice", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 12 }));
    store.dispatch(pauseExam(T0));
    const id = store.getState().paused.runs[0].id;
    store.dispatch(resumeRun(id, T0 + 1_000));
    store.dispatch(pauseExam(T0 + 2_000));

    expect(store.getState().paused.runs).toHaveLength(1);
    expect(store.getState().paused.runs[0].id).toBe(id);
  });

  it("keeps a parked run safe when another exam is started", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 12 }));
    store.dispatch(pauseExam(T0));
    store.dispatch(startExam({ mode: "domain", domain: 2 }));
    expect(store.getState().paused.runs).toHaveLength(1);
    expect(store.getState().exam.config).toMatchObject({ mode: "domain" });
  });

  it("does nothing when asked to resume a run that is gone", () => {
    const store = makeStore();
    store.dispatch(resumeRun("nope", T0));
    expect(store.getState().exam.screen).toBe("home");
  });

  it("keeps only the most recent runs", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 12 }));
    store.dispatch(pauseExam(T0));
    const oldest = store.getState().paused.runs[0];
    for (let i = 1; i <= MAX_PAUSED; i++) {
      store.dispatch(pausedActions.runPaused({ ...oldest, id: `run-${i}`, pausedAt: T0 + i }));
    }
    const { runs } = store.getState().paused;
    expect(runs).toHaveLength(MAX_PAUSED);
    expect(runs[0].id).toBe(`run-${MAX_PAUSED}`);
    expect(runs.some((r) => r.id === oldest.id)).toBe(false);
  });

  it("drops a run on delete", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 12 }));
    store.dispatch(pauseExam(T0));
    store.dispatch(pausedActions.runDiscarded(store.getState().paused.runs[0].id));
    expect(store.getState().paused.runs).toHaveLength(0);
  });
});

describe("the run clock", () => {
  it("counts only time on the exam, not time spent parked", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 12 }));
    const q = store.getState().exam.questions[0];
    const startedAt = store.getState().exam.runningSince ?? 0;

    store.dispatch(answerQuestion(q.id, q.correctKey, true, startedAt + 60_000));
    store.dispatch(pauseExam(startedAt + 90_000));
    // parked for a day
    const resumedAt = startedAt + 90_000 + 86_400_000;
    store.dispatch(resumeRun(store.getState().paused.runs[0].id, resumedAt));
    store.dispatch(finishExam(resumedAt + 30_000));

    expect(store.getState().history.attempts[0].elapsedSeconds).toBe(120);
  });

  it("freezes a timed budget while the run is parked", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 12, timed: true }));
    const startedAt = store.getState().exam.runningSince ?? 0;
    store.dispatch(pauseExam(startedAt + 60_000));

    const run = store.getState().paused.runs[0];
    expect(run.remainingSeconds).toBe(12 * 120 - 60);
    expect(run.runningSince).toBeNull();

    store.dispatch(resumeRun(run.id, startedAt + 86_400_000));
    expect(store.getState().exam.remainingSeconds).toBe(12 * 120 - 60);
  });

  it("banks time up to the last answer, so closing the tab loses no more than that", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 12 }));
    const q = store.getState().exam.questions[0];
    const startedAt = store.getState().exam.runningSince ?? 0;
    store.dispatch(answerQuestion(q.id, q.correctKey, true, startedAt + 45_000));
    expect(store.getState().exam.elapsedSeconds).toBe(45);
  });
});
