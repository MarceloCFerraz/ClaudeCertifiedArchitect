import type { UnknownAction } from "@reduxjs/toolkit";
import { examActions } from "./exam-slice";
import type { RootState } from "./index";

/** Actions to apply once the persisted state is rehydrated, before anything renders.
    Both are idempotent — StrictMode fires the lift callback twice in development. */
export function bootActions(state: RootState, now: number): UnknownAction[] {
  const { screen, questions } = state.exam;
  if (screen === "home") return [];
  // A run stored before draws were persisted has no questions and can never get any:
  // rendering it would land on a blank screen with no way back to the home page.
  if (questions.length === 0) return [examActions.examCleared()];
  // The clock stopped when the tab closed, so a closed app neither burns a timed
  // budget nor inflates elapsed time. Reopening starts a fresh segment.
  return screen === "exam" ? [examActions.clockResumed(now)] : [];
}
