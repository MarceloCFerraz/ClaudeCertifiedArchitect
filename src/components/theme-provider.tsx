import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyTheme,
  browserStorage,
  nextPreference,
  type ResolvedTheme,
  readPreference,
  resolveTheme,
  type ThemePreference,
  writePreference,
} from "../lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";
const storage = browserStorage();

interface ThemeContextValue {
  preference: ThemePreference;
  theme: ResolvedTheme;
  selectPreference: (preference: ThemePreference) => void;
  cyclePreference: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readPreference(storage));
  const [prefersDark, setPrefersDark] = useState(() => window.matchMedia(DARK_QUERY).matches);
  const theme = resolveTheme(preference, prefersDark);

  // Keeps "system" honest: follow the OS when it flips, without needing a reload.
  useEffect(() => {
    const query = window.matchMedia(DARK_QUERY);
    const onChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // The pre-paint script in index.html set this already; this keeps it in step.
  useEffect(() => {
    applyTheme(document.documentElement, theme);
  }, [theme]);

  const selectPreference = useCallback((next: ThemePreference) => {
    writePreference(storage, next);
    setPreferenceState(next);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      theme,
      selectPreference,
      cyclePreference: () => selectPreference(nextPreference(preference)),
    }),
    [preference, theme, selectPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
