import { useEffect, useId, useRef } from "react";
import GlossaryContent from "./glossary-content";
import { useGlossary } from "./glossary-provider";

/* The look-it-up form of the glossary: an overlay, so whatever you were reading is still
   there behind it. Escape and outside-click handling is the same idiom as
   LeaveExamMenu; there is no focus trap, which is noted in CLAUDE.md. */

export default function GlossaryModal() {
  const { closeGlossary } = useGlossary();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    // Restore focus to whatever opened the modal, so closing it does not dump you at the
    // top of the document.
    const opener = document.activeElement;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeGlossary();
    }
    function onPointerDown(e: PointerEvent) {
      if (!panelRef.current?.contains(e.target as Node)) closeGlossary();
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [closeGlossary]);

  return (
    <>
      {/* The scrim uses the HUD surface rather than the foreground: --foreground is
          near-white in dark mode, so a foreground scrim would lighten the page it is
          meant to be dimming. --hud is dark chrome in both themes. */}
      <div className="fixed inset-0 z-40 bg-hud/60" aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3">
            <h2
              id={titleId}
              className="font-mono text-xs uppercase tracking-widest text-foreground-faint"
            >
              Glossary
            </h2>
            <button
              type="button"
              onClick={closeGlossary}
              aria-label="Close glossary"
              className="rounded font-mono text-xs text-foreground-faint transition hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
            >
              ✕
            </button>
          </div>
          {/* overscroll-contain keeps the exam behind from scrolling once this list hits
              its end — a body-scroll lock would shift the page under the overlay. */}
          <div className="overflow-y-auto overscroll-contain px-5 py-4">
            <GlossaryContent />
          </div>
        </div>
      </div>
    </>
  );
}
