import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Attempt } from "../lib/types";

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
