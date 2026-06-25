import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { Answers, ExamConfig, PreparedQuestion, Screen, Session } from "../lib/types";

export interface ExamState {
  screen: Screen;
  config: ExamConfig | null;
  seed: number | null;
  session: Session | null;
  questions: PreparedQuestion[]; // not persisted — rebuilt from (config, seed) on resume
  idx: number;
  answers: Answers;
  timed: boolean;
  remaining: number; // seconds left when timed
}

export interface ExamStartedPayload {
  config: ExamConfig;
  seed: number;
  session: Session;
  questions: PreparedQuestion[];
  timed: boolean;
  remaining: number;
}

const initialState: ExamState = {
  screen: "home",
  config: null,
  seed: null,
  session: null,
  questions: [],
  idx: 0,
  answers: {},
  timed: false,
  remaining: 0,
};

const examSlice = createSlice({
  name: "exam",
  initialState,
  reducers: {
    examStarted(state, action: PayloadAction<ExamStartedPayload>) {
      const { config, seed, session, questions, timed, remaining } = action.payload;
      state.config = config;
      state.seed = seed;
      state.session = session;
      state.questions = questions;
      state.timed = timed;
      state.remaining = remaining;
      state.idx = 0;
      state.answers = {};
      state.screen = "exam";
    },
    answered(state, action: PayloadAction<{ qid: string; selected: string; correct: boolean }>) {
      const { qid, selected, correct } = action.payload;
      if (!state.answers[qid]) state.answers[qid] = { selected, correct };
    },
    advanced(state) {
      if (state.idx + 1 < state.questions.length) state.idx += 1;
    },
    decrementTimer(state) {
      if (state.remaining > 0) state.remaining -= 1;
    },
    questionsRebuilt(state, action: PayloadAction<PreparedQuestion[]>) {
      state.questions = action.payload;
    },
    finished(state) {
      state.screen = "results";
    },
    exitedToHome(state) {
      state.screen = "home";
    },
  },
});

export const examActions = examSlice.actions;
export default examSlice.reducer;
