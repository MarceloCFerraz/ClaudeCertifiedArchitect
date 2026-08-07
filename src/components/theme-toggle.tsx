import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { THEME_PREFERENCES, type ThemePreference } from "../lib/theme";
import { Icon } from "./atoms";
import { useTheme } from "./theme-provider";

/** How long the pointer must rest on the button before the menu appears. Long enough
    that passing over it does nothing, short enough to feel like a deliberate hover. */
const HOVER_INTENT_MS = 300;
/** Grace period so the pointer can cross the gap from button to menu without it closing. */
const CLOSE_GRACE_MS = 150;

const ICONS: Record<ThemePreference, ReactNode> = {
  system: (
    <Icon>
      <rect x="2.5" y="4" width="19" height="12" rx="2" />
      <path d="M8.5 20h7M12 16v4" />
    </Icon>
  ),
  light: (
    <Icon>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
  ),
  dark: (
    <Icon>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </Icon>
  ),
};

const OPTION_LABELS: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

const HINTS: Record<ThemePreference, string> = {
  system: "Theme: system — click for light, or hover for all options",
  light: "Theme: light — click for dark, or hover for all options",
  dark: "Theme: dark — click to follow the system, or hover for all options",
};

/** Click cycles system → light → dark. Resting the pointer on it opens a menu with all
    three, for picking directly. Deliberately quiet until hovered, so it never competes
    with the exam content. */
export default function ThemeToggle({
  className = "",
  menuPlacement = "below",
  menuAlign = "right",
}: {
  className?: string;
  menuPlacement?: "below" | "above";
  menuAlign?: "left" | "right";
}) {
  const { preference, selectPreference, cyclePreference } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const cancelTimers = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);

  const close = useCallback(() => {
    cancelTimers();
    setMenuOpen(false);
  }, [cancelTimers]);

  const onButtonEnter = useCallback(() => {
    cancelTimers();
    openTimer.current = window.setTimeout(() => setMenuOpen(true), HOVER_INTENT_MS);
  }, [cancelTimers]);

  const onButtonLeave = useCallback(() => {
    cancelTimers();
    closeTimer.current = window.setTimeout(() => setMenuOpen(false), CLOSE_GRACE_MS);
  }, [cancelTimers]);

  useEffect(() => cancelTimers, [cancelTimers]);

  /* Escape closes it, and so does a click anywhere else — the pointer-out path alone
     would strand the menu open when it was opened from the keyboard. */
  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  return (
    <div className={className}>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => {
            cancelTimers();
            cyclePreference();
          }}
          onMouseEnter={onButtonEnter}
          onMouseLeave={onButtonLeave}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setMenuOpen(true);
            }
          }}
          title={HINTS[preference]}
          aria-label={HINTS[preference]}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/[0.07] bg-foreground/[0.02] text-foreground/25 transition-all duration-200 hover:scale-105 hover:border-foreground/25 hover:bg-foreground/10 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
        >
          {ICONS[preference]}
        </button>

        {/* Unrolls like a parchment: the grid row grows from 0fr, so the panel is
            revealed rather than squashed. It stays mounted so the roll-up can play on
            close, and `invisible` keeps it out of the tab order meanwhile. Anchoring
            does the rest — it unrolls downward in the gutter, upward in the footer. */}
        {/* w-max is load-bearing: without it this box shrink-to-fits against the 36px
            button, and the overflow-hidden below would clip the labels horizontally.
            Opening left runs toward the viewport edge, so it is also capped at the
            gutter space actually left over — a backstop against wide font rendering
            pushing the panel off-screen and forcing a horizontal scrollbar. */}
        <div
          className={`absolute z-50 w-max ${
            menuPlacement === "above" ? "bottom-full pb-2" : "top-full pt-2"
          } ${menuAlign === "left" ? "left-0 max-w-[calc(50vw-25rem)]" : "right-0"} ${
            menuOpen ? "" : "pointer-events-none"
          }`}
        >
          {/* Asymmetric on purpose: it snaps open, then rolls back up more slowly. The
              duration lives on each state because the transition is driven by whichever
              one the element is moving *into*. */}
          <div
            className={`grid transition-[grid-template-rows,opacity,visibility] motion-reduce:transition-none ${
              menuOpen
                ? "visible opacity-100 duration-200 ease-out [grid-template-rows:1fr]"
                : "invisible opacity-0 duration-300 ease-in-out [grid-template-rows:0fr]"
            }`}
          >
            <div className="min-h-0 overflow-hidden">
              <div
                role="menu"
                aria-label="Theme"
                onMouseEnter={cancelTimers}
                onMouseLeave={close}
                className="min-w-[6.25rem] rounded-lg border border-border bg-card p-1 shadow-lg"
              >
                {THEME_PREFERENCES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="menuitemradio"
                    aria-checked={option === preference}
                    onClick={() => {
                      selectPreference(option);
                      close();
                    }}
                    className={`flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid ${
                      option === preference
                        ? "bg-foreground/10 font-medium text-foreground"
                        : "text-foreground-muted hover:bg-foreground/[0.06] hover:text-foreground"
                    }`}
                  >
                    {ICONS[option]}
                    <span>{OPTION_LABELS[option]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
