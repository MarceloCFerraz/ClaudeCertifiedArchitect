/** Must stay in sync with the pre-paint script in index.html. */
export const THEME_STORAGE_KEY = "cca-f-theme";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

/* The DOM and storage surfaces are narrowed to what this module actually needs, so
   callers can pass fakes: Jest runs on the node environment and `npm test` disables
   web storage, meaning neither `localStorage` nor `document` exists in tests. */
export type ThemeStorage = Pick<Storage, "getItem" | "setItem">;
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
  const position = THEME_PREFERENCES.indexOf(current);
  return THEME_PREFERENCES[(position + 1) % THEME_PREFERENCES.length];
}

/** An explicit preference wins; "system" defers to the OS signal. */
export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === "system") return prefersDark ? "dark" : "light";
  return preference;
}

/** Reading `window.localStorage` can itself throw in private-browsing modes, so the
    property access is guarded too — not only the calls on it. Null means "no persistence";
    losing the saved preference is survivable, taking the whole app down with it is not. */
export function browserStorage(): ThemeStorage | null {
  try {
    return window.localStorage;
  } catch (error) {
    console.warn("Local storage is unavailable; the theme will reset on reload.", error);
    return null;
  }
}

/** Anything unrecognized (absent, corrupted, written by an older build) means "system". */
export function readPreference(storage: ThemeStorage | null): ThemePreference {
  if (!storage) return "system";
  try {
    const stored = storage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch (error) {
    console.warn("Theme preference could not be read; defaulting to system.", error);
    return "system";
  }
}

/** Returns whether the preference was persisted; it still applies for this session either way. */
export function writePreference(
  storage: ThemeStorage | null,
  preference: ThemePreference,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(THEME_STORAGE_KEY, preference);
    return true;
  } catch (error) {
    console.warn("Theme preference could not be saved; it will reset on reload.", error);
    return false;
  }
}

export function applyTheme(root: ThemeRoot, theme: ResolvedTheme): void {
  root.classList.toggle("dark", theme === "dark");
}
