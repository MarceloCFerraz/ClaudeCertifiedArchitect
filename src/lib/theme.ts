import {
  nextInCycle,
  type PreferenceStorage,
  readStoredPreference,
  writeStoredPreference,
} from "./preference";

/** Must stay in sync with the pre-paint script in index.html. */
export const THEME_STORAGE_KEY = "cca-f-theme";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export type ThemeStorage = PreferenceStorage;
export { browserStorage } from "./preference";

/* The DOM surface is narrowed to what this module actually needs, so callers can pass
   a fake: Jest runs on the node environment, where `document` does not exist. */
export interface ThemeRoot {
  classList: Pick<DOMTokenList, "toggle">;
}

/** The order the button cycles through, and the order the hover menu lists. */
export const THEME_PREFERENCES: readonly ThemePreference[] = ["system", "light", "dark"];

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference);
}

/** system → light → dark → system. */
export function nextPreference(current: ThemePreference): ThemePreference {
  return nextInCycle(THEME_PREFERENCES, current);
}

/** An explicit preference wins; "system" defers to the OS signal. */
export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === "system") return prefersDark ? "dark" : "light";
  return preference;
}

/** Anything unrecognized (absent, corrupted, written by an older build) means "system". */
export function readPreference(storage: ThemeStorage | null): ThemePreference {
  return readStoredPreference(storage, THEME_STORAGE_KEY, THEME_PREFERENCES, "system");
}

/** Returns whether the preference was persisted; it still applies for this session either way. */
export function writePreference(
  storage: ThemeStorage | null,
  preference: ThemePreference,
): boolean {
  return writeStoredPreference(storage, THEME_STORAGE_KEY, preference);
}

export function applyTheme(root: ThemeRoot, theme: ResolvedTheme): void {
  root.classList.toggle("dark", theme === "dark");
}
