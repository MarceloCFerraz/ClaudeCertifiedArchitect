/* Storage plumbing shared by every user preference that lives outside the store.
   Preferences are deliberately not Redux state: every slice persists to IndexedDB
   asynchronously, and a preference has to be readable synchronously and survive a
   cleared run. */

/* The storage surface is narrowed to what these functions actually need, so callers
   can pass fakes: Jest runs on the node environment and `npm test` disables web
   storage, meaning `localStorage` does not exist in tests. */
export type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

/** Reading `window.localStorage` can itself throw in private-browsing modes, so the
    property access is guarded too — not only the calls on it. Null means "no
    persistence"; losing a saved preference is survivable, taking the whole app down
    with it is not. */
export function browserStorage(): PreferenceStorage | null {
  try {
    return window.localStorage;
  } catch (error) {
    console.warn("Local storage is unavailable; preferences will reset on reload.", error);
    return null;
  }
}

/** Anything unrecognized (absent, corrupted, written by an older build) means `fallback`. */
export function readStoredPreference<T extends string>(
  storage: PreferenceStorage | null,
  key: string,
  allowed: readonly T[],
  fallback: T,
): T {
  if (!storage) return fallback;
  try {
    const stored = storage.getItem(key);
    return allowed.includes(stored as T) ? (stored as T) : fallback;
  } catch (error) {
    console.warn(`Preference "${key}" could not be read; using the default.`, error);
    return fallback;
  }
}

/** Returns whether the value was persisted; it still applies for this session either way. */
export function writeStoredPreference(
  storage: PreferenceStorage | null,
  key: string,
  value: string,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Preference "${key}" could not be saved; it will reset on reload.`, error);
    return false;
  }
}

/** The next value in a cycle, wrapping at the end. A value outside the cycle starts it
    over, so a preference restored from an older build cannot strand the toggle. */
export function nextInCycle<T>(values: readonly T[], current: T): T {
  const position = values.indexOf(current);
  return values[(position + 1) % values.length];
}
