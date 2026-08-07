import { useEffect } from "react";
import GlossaryContent from "./glossary-content";
import { useGlossary } from "./glossary-provider";

/* The browsing form of the glossary, shown in place of the home screen. Nothing else on
   the home route listens for Escape, so it can close the same way the modal does. */

export default function GlossaryPage() {
  const { closeGlossary } = useGlossary();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeGlossary();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeGlossary]);

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-brand">Reference</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Glossary</h1>
        <p className="mt-3 text-foreground-muted">
          The vocabulary the exam takes for granted, in plain English. These terms are also
          underlined in the explanations you get after answering a question — hover, tap or tab to
          one to see its definition without leaving the page.
        </p>

        <button
          type="button"
          onClick={closeGlossary}
          className="mt-6 rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold transition hover:border-border-hover-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
        >
          ← Back
        </button>

        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <GlossaryContent />
        </div>
      </div>
    </div>
  );
}
