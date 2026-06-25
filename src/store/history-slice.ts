import { type PayloadAction, createSlice } from "@reduxjs/toolkit";
import type { Mode } from "../lib/types";

export interface AttemptDomain {
  domain: number;
  correct: number;
  total: number;
}

/** Compact record of a finished exam — no question text, so history stays small. */
export interface Attempt {
  id: string;
  mode: Mode;
  label: string;
  date: number; // epoch ms
  scaled: number;
  passing: boolean;
  correct: number;
  answered: number;
  total: number;
  elapsedSeconds: number;
  perDomain: AttemptDomain[];
}

export interface HistoryState {
  attempts: Attempt[];
}

const MAX_ATTEMPTS = 200;

const initialState: HistoryState = { attempts: [] };

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    attemptRecorded(state, action: PayloadAction<Attempt>) {
      state.attempts.unshift(action.payload);
      if (state.attempts.length > MAX_ATTEMPTS) state.attempts.length = MAX_ATTEMPTS;
    },
    historyCleared(state) {
      state.attempts = [];
    },
  },
});

export const historyActions = historySlice.actions;
export default historySlice.reducer;
