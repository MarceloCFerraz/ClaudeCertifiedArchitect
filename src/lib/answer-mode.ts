import {
  nextInCycle,
  type PreferenceStorage,
  readStoredPreference,
  writeStoredPreference,
} from "./preference";

export const ANSWER_MODE_STORAGE_KEY = "cca-f-answer-mode";

/** "submit" — pick a choice, then commit it explicitly. "instant" — the click *is* the
    answer, which is how the app behaved before this setting existed.

    The controls label this mode "Confirm", not "Submit": on screen it would otherwise
    share a verb with the "Submit answer" button beside it. The identifier stays
    "submit" because that is what the code does — `submitAnswer`, `showSubmitButton` —
    and renaming it would orphan every preference already in localStorage. */
export type AnswerMode = "submit" | "instant";

/** The order the toggle cycles through. */
export const ANSWER_MODES: readonly AnswerMode[] = ["submit", "instant"];

/** Reading a long stem and pointing at the option that looks best *so far* should not
    score it, so the two-step flow is what someone gets before they express a preference. */
export const DEFAULT_ANSWER_MODE: AnswerMode = "submit";

export function isAnswerMode(value: unknown): value is AnswerMode {
  return ANSWER_MODES.includes(value as AnswerMode);
}

export function nextAnswerMode(current: AnswerMode): AnswerMode {
  return nextInCycle(ANSWER_MODES, current);
}

export function readAnswerMode(storage: PreferenceStorage | null): AnswerMode {
  return readStoredPreference(storage, ANSWER_MODE_STORAGE_KEY, ANSWER_MODES, DEFAULT_ANSWER_MODE);
}

export function writeAnswerMode(storage: PreferenceStorage | null, mode: AnswerMode): boolean {
  return writeStoredPreference(storage, ANSWER_MODE_STORAGE_KEY, mode);
}
