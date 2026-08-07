import {
  STICKY_INSET,
  TOOLTIP_HEIGHT,
  TOOLTIP_WIDTH,
  tooltipOffset,
  tooltipPlacement,
  VIEWPORT_MARGIN,
} from "../../src/lib/tooltip-position";

const WIDE = 1200;
const TALL = 800;

/** Where the panel's left edge lands in viewport coordinates, which is what the clamp
    is actually about — the returned offset is relative to the trigger. */
const panelLeft = (trigger: { left: number; width: number }, viewportWidth = WIDE) =>
  trigger.left + tooltipOffset(trigger, TOOLTIP_WIDTH, viewportWidth);

describe("tooltipOffset", () => {
  it("centres the panel on the trigger when there is room on both sides", () => {
    const trigger = { left: 500, width: 80 };
    expect(panelLeft(trigger)).toBe(500 + 40 - TOOLTIP_WIDTH / 2);
  });

  it("pins the panel to the left margin near the left edge", () => {
    expect(panelLeft({ left: 4, width: 60 })).toBe(VIEWPORT_MARGIN);
  });

  it("pins the panel to the right margin near the right edge", () => {
    expect(panelLeft({ left: WIDE - 70, width: 60 })).toBe(WIDE - TOOLTIP_WIDTH - VIEWPORT_MARGIN);
  });

  it("pins the panel left when the viewport is narrower than the panel", () => {
    expect(panelLeft({ left: 40, width: 60 }, 200)).toBe(VIEWPORT_MARGIN);
  });

  it("returns an offset relative to the trigger", () => {
    const near = tooltipOffset({ left: 500, width: 80 }, TOOLTIP_WIDTH, WIDE);
    const far = tooltipOffset({ left: 600, width: 80 }, TOOLTIP_WIDTH, WIDE);
    expect(far).toBe(near);
  });
});

describe("tooltipPlacement", () => {
  it("opens below the term when the panel fits there", () => {
    expect(tooltipPlacement({ top: 200, bottom: 220 }, TALL)).toBe("below");
  });

  it("flips above when the panel would fall off the bottom but fits above", () => {
    expect(tooltipPlacement({ top: TALL - 40, bottom: TALL - 20 }, TALL)).toBe("above");
  });

  it("stays below when the panel fits neither above nor below", () => {
    expect(tooltipPlacement({ top: 100, bottom: 120 }, 150)).toBe("below");
  });

  it("keeps the panel below a term sitting just under the sticky header", () => {
    const justBelowHeader = { top: STICKY_INSET + 4, bottom: STICKY_INSET + 24 };
    const shortViewport = justBelowHeader.bottom + TOOLTIP_HEIGHT - 1;
    expect(tooltipPlacement(justBelowHeader, shortViewport)).toBe("below");
  });
});
