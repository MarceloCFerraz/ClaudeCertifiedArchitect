import { configureStore } from "@reduxjs/toolkit";
import { rebuildExam } from "../../src/lib/session";
import examReducer, { examActions } from "../../src/store/exam-slice";
import historyReducer from "../../src/store/history-slice";
import { finishExam, startExam } from "../../src/store/thunks";

// A plain store without redux-persist (no browser/IndexedDB needed).
function makeStore() {
  return configureStore({ reducer: { exam: examReducer, history: historyReducer } });
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

  it("rebuilds the identical draw from the persisted (config, seed)", () => {
    const store = makeStore();
    store.dispatch(startExam({ mode: "balanced", length: 24 }));
    const { config, seed, questions } = store.getState().exam;
    if (!config || seed === null) throw new Error("expected an active session");
    const rebuilt = rebuildExam(config, seed);
    expect(rebuilt.map((q) => q.id)).toEqual(questions.map((q) => q.id));
    expect(rebuilt.map((q) => q.correctKey)).toEqual(questions.map((q) => q.correctKey));
  });
});
