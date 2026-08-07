import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import {
  type AnswerMode,
  nextAnswerMode,
  readAnswerMode,
  writeAnswerMode,
} from "../lib/answer-mode";
import { browserStorage } from "../lib/preference";

/* Deliberately not in the store, and for a different reason than the theme: this is a
   preference about the person, not about the run. In the store it would be captured
   into a PausedRun and restored with it, and wiped by `examCleared` — so leaving one
   exam would silently reset how the next one answers. localStorage outlives runs. */
const storage = browserStorage();

interface AnswerModeContextValue {
  mode: AnswerMode;
  setMode: (mode: AnswerMode) => void;
  toggleMode: () => void;
}

const AnswerModeContext = createContext<AnswerModeContextValue | null>(null);

export function AnswerModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AnswerMode>(() => readAnswerMode(storage));

  const setMode = useCallback((next: AnswerMode) => {
    writeAnswerMode(storage, next);
    setModeState(next);
  }, []);

  const value = useMemo(
    () => ({ mode, setMode, toggleMode: () => setMode(nextAnswerMode(mode)) }),
    [mode, setMode],
  );

  return <AnswerModeContext.Provider value={value}>{children}</AnswerModeContext.Provider>;
}

export function useAnswerMode(): AnswerModeContextValue {
  const context = useContext(AnswerModeContext);
  if (!context) throw new Error("useAnswerMode must be used within an AnswerModeProvider");
  return context;
}
