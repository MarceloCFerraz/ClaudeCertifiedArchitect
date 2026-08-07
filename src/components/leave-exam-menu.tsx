import { useEffect, useRef } from "react";

/* Leaving mid-exam is the one irreversible choice in the app, so it is never inferred:
   the ✕ asks whether to keep the run or throw it away. Borrowed from ThemeToggle's menu
   — same anchoring, Escape and outside-click handling — but click-to-open, since
   hovering onto a destructive choice should never arm it. */

export default function LeaveExamMenu({
  open,
  onOpenChange,
  onPause,
  onDiscard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPause: () => void;
  onDiscard: () => void;
}) {
  // Wraps the button as well as the panel, so clicking ✕ to close doesn't register as
  // an outside click and immediately reopen it.
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="font-mono text-xs text-stone-400 transition hover:text-stone-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
        title="Leave exam"
        aria-label="Leave exam"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        ✕
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Leave exam"
          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={onPause}
            className="w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground transition hover:bg-foreground/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
          >
            <span className="font-medium">Pause &amp; exit</span>
            <span className="mt-0.5 block text-xs text-foreground-faint">
              Keep it on the home screen. The timer stops while paused.
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onDiscard}
            className="w-full rounded-md px-2 py-1.5 text-left text-sm text-destructive-text transition hover:bg-destructive-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
          >
            <span className="font-medium">Discard</span>
            <span className="mt-0.5 block text-xs text-foreground-faint">
              Throw the run away. Your answers are lost.
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground-muted transition hover:bg-foreground/[0.06] hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
