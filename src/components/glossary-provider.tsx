import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { GLOSSARY } from "../data/glossary";
import { buildTermIndex, type TermIndex } from "../lib/glossary-terms";

/* Whether the glossary is open is deliberately not in the store: every slice there is
   persisted to IndexedDB, and reopening the app onto a glossary you left open days ago
   would be wrong. Same reasoning as ThemeProvider, and the same shape. */

interface GlossaryContextValue {
  open: boolean;
  openGlossary: () => void;
  closeGlossary: () => void;
  /** Compiled once here, so the twenty explanations on a results screen share one
      regex instead of each building their own. */
  index: TermIndex;
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null);

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openGlossary = useCallback(() => setOpen(true), []);
  const closeGlossary = useCallback(() => setOpen(false), []);
  const index = useMemo(() => buildTermIndex(GLOSSARY), []);

  const value = useMemo(
    () => ({ open, openGlossary, closeGlossary, index }),
    [open, openGlossary, closeGlossary, index],
  );

  return <GlossaryContext.Provider value={value}>{children}</GlossaryContext.Provider>;
}

export function useGlossary(): GlossaryContextValue {
  const context = useContext(GlossaryContext);
  if (!context) throw new Error("useGlossary must be used within a GlossaryProvider");
  return context;
}
