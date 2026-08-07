import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PausedRun } from "../lib/types";

export interface PausedState {
  runs: PausedRun[];
}

/* Far lower than history's cap: each entry carries its own draw (~58 KB for a mock),
   and evicting one destroys real work rather than a finished record. The panel says
   so when the list is full. */
export const MAX_PAUSED = 10;

const initialState: PausedState = { runs: [] };

const pausedSlice = createSlice({
  name: "paused",
  initialState,
  reducers: {
    /** Upsert: pausing the same run twice replaces its entry instead of cloning it. */
    runPaused(state, action: PayloadAction<PausedRun>) {
      state.runs = state.runs.filter((r) => r.id !== action.payload.id);
      state.runs.unshift(action.payload);
      if (state.runs.length > MAX_PAUSED) state.runs.length = MAX_PAUSED;
    },
    runDiscarded(state, action: PayloadAction<string>) {
      state.runs = state.runs.filter((r) => r.id !== action.payload);
    },
  },
});

export const pausedActions = pausedSlice.actions;
export default pausedSlice.reducer;
