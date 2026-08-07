import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { foldClock } from "../lib/exam-clock";
import type { ExamConfig, ExamState, PausedRun, PreparedQuestion, Session } from "../lib/types";

export interface ExamStartedPayload {
  config: ExamConfig;
  seed: number;
  session: Session;
  questions: PreparedQuestion[];
  timed: boolean;
  remainingSeconds: number;
}

const initialState: ExamState = {
  screen: "home",
  config: null,
  seed: null,
  session: null,
  questions: [],
  idx: 0,
  answers: {},
  eliminations: {},
  timed: false,
  elapsedSeconds: 0,
  remainingSeconds: 0,
  runningSince: null,
};

const examSlice = createSlice({
  name: "exam",
  initialState,
  reducers: {
    examStarted(state, action: PayloadAction<ExamStartedPayload>) {
      const { config, seed, session, questions, timed, remainingSeconds } = action.payload;
      state.config = config;
      state.seed = seed;
      state.session = session;
      state.questions = questions;
      state.timed = timed;
      state.remainingSeconds = remainingSeconds;
      state.elapsedSeconds = 0;
      state.runningSince = session.createdAt;
      state.idx = 0;
      state.answers = {};
      state.eliminations = {};
      state.screen = "exam";
    },
    /* `selected` is the positional letter the shuffle assigned, so an answer only means
       anything alongside the draw it was given for — which is why the draw travels with
       the run and is never regenerated. */
    answered(state, action: PayloadAction<{ qid: string; selected: string; correct: boolean }>) {
      const { qid, selected, correct } = action.payload;
      if (!state.answers[qid]) state.answers[qid] = { selected, correct };
    },
    /* Crossing a choice out is a scratchpad, not an answer: it never consults
       `correctKey`, so nothing about how the question scores can leak before the
       reader commits. Crossing every choice out is allowed — it is their reasoning
       to record, and a cross-out is always reversible. */
    eliminationToggled(state, action: PayloadAction<{ qid: string; key: string }>) {
      const { qid, key } = action.payload;
      if (state.answers[qid]) return;
      const current = state.eliminations[qid] ?? [];
      const next = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key].sort();
      if (next.length === 0) delete state.eliminations[qid];
      else state.eliminations[qid] = next;
    },
    navigatedTo(state, action: PayloadAction<number>) {
      const max = state.questions.length - 1;
      if (max < 0) return;
      state.idx = Math.max(0, Math.min(action.payload, max));
    },
    /** Start a fresh segment, discarding any unbanked time. Used at boot: the stored
        `runningSince` predates the tab closing, and counting that gap would burn a
        timed budget while the app wasn't even open. */
    clockResumed(state, action: PayloadAction<number>) {
      state.runningSince = action.payload;
    },
    /** Bank the segment so far and start a new one. Dispatched alongside each answer so
        the persisted clock is never staler than the last question — closing the tab then
        loses at most one question's worth of time instead of the whole sitting. */
    clockCheckpointed(state, action: PayloadAction<number>) {
      const now = action.payload;
      Object.assign(state, foldClock(state, now));
      state.runningSince = now;
    },
    examResumed(state, action: PayloadAction<{ run: PausedRun; now: number }>) {
      const { run, now } = action.payload;
      state.config = run.config;
      state.seed = run.seed;
      state.session = run.session;
      state.questions = run.questions;
      state.timed = run.timed;
      state.elapsedSeconds = run.elapsedSeconds;
      state.remainingSeconds = run.remainingSeconds;
      state.runningSince = now;
      state.idx = run.idx;
      state.answers = run.answers;
      state.eliminations = run.eliminations ?? {};
      state.screen = "exam";
    },
    finished(state, action: PayloadAction<number>) {
      Object.assign(state, foldClock(state, action.payload));
      state.screen = "results";
    },
    examCleared() {
      return initialState;
    },
  },
});

export const examActions = examSlice.actions;
export default examSlice.reducer;
