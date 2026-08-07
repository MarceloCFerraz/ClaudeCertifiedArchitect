/* Placement arithmetic for the glossary term tooltip. It is pure and lives here rather
   than inline in the component because there is no portal: the panel is positioned
   against its trigger, and `body` sets no overflow-x, so a panel that overhangs the
   viewport adds a horizontal scrollbar to the whole page. CSS centring cannot clamp
   against the viewport, so the clamping is done here — and is testable as a result. */

/** Tailwind `w-64`, and the gap the panel keeps from either edge of the viewport. */
export const TOOLTIP_WIDTH = 256;
export const VIEWPORT_MARGIN = 8;

/** Estimated panel height: a definition at the schema's character cap, set in the panel
    width, plus padding. Honest only because DEF_MAX_CHARS bounds the definition — raise
    that cap and this stops predicting anything. */
export const TOOLTIP_HEIGHT = 120;

/** The exam HUD is sticky at the top of the viewport, so a panel flipped upward has to
    clear it rather than open underneath it. */
export const STICKY_INSET = 64;

export type TooltipPlacement = "below" | "above";

/** Offset in pixels from the trigger's left edge that centres the panel on the trigger
    without letting it cross the margin on either side. Returned relative to the trigger
    because that is what the panel is positioned against. */
export function tooltipOffset(
  trigger: { left: number; width: number },
  tooltipWidth: number,
  viewportWidth: number,
  margin = VIEWPORT_MARGIN,
): number {
  const centered = trigger.left + trigger.width / 2 - tooltipWidth / 2;
  // A viewport narrower than the panel leaves no valid range at all; pin to the left.
  const rightmost = Math.max(margin, viewportWidth - tooltipWidth - margin);
  return Math.min(Math.max(centered, margin), rightmost) - trigger.left;
}

/** Below the term by default, flipping above only when it would fall off the bottom and
    there is genuinely room above. When neither fits it stays below — predictable beats
    clever, and the panel scrolls into view with the page. */
export function tooltipPlacement(
  trigger: { top: number; bottom: number },
  viewportHeight: number,
  tooltipHeight = TOOLTIP_HEIGHT,
  topInset = STICKY_INSET,
): TooltipPlacement {
  const fitsBelow = trigger.bottom + tooltipHeight <= viewportHeight;
  const fitsAbove = trigger.top - tooltipHeight >= topInset;
  return fitsBelow || !fitsAbove ? "below" : "above";
}
