import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { GlossaryEntry } from "../data/schema";
import { annotate } from "../lib/glossary-terms";
import {
  TOOLTIP_WIDTH,
  type TooltipPlacement,
  tooltipOffset,
  tooltipPlacement,
} from "../lib/tooltip-position";
import { useGlossary } from "./glossary-provider";

/* Renders prose with its glossary terms underlined. Used only for explanations — never
   for a question stem or its choices, where highlighting some words and not others
   would nudge the reader toward an answer before they have committed to one. */

function TermTooltip({ entry, text }: { entry: GlossaryEntry; text: string }) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // Sticky on tap, which is the only way to reach a definition on a touch screen —
  // there is no hover there, and a dashed underline that did nothing would be a lie.
  const [pinned, setPinned] = useState(false);
  const [position, setPosition] = useState<{ left: number; placement: TooltipPlacement }>({
    left: 0,
    placement: "below",
  });
  const tipId = useId();
  const visible = hovered || focused || pinned;

  useLayoutEffect(() => {
    if (!visible) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      left: tooltipOffset(rect, TOOLTIP_WIDTH, window.innerWidth),
      placement: tooltipPlacement(rect, window.innerHeight),
    });
  }, [visible]);

  useEffect(() => {
    if (!pinned) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPinned(false);
    }
    function onPointerDown(e: PointerEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setPinned(false);
    }
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [pinned]);

  return (
    <span ref={wrapperRef} className="relative">
      <button
        type="button"
        data-glossary-term
        onClick={() => setPinned((was) => !was)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-describedby={visible ? tipId : undefined}
        className="cursor-help rounded-sm underline decoration-brand decoration-dashed underline-offset-4 transition hover:text-brand hover:decoration-solid focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
      >
        {text}
      </button>
      {visible && (
        <span
          id={tipId}
          role="tooltip"
          style={{ left: position.left }}
          className={`absolute z-30 block w-64 max-w-[calc(100vw-1rem)] rounded-lg border border-border bg-card p-3 text-left shadow-lg ${
            position.placement === "above" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
        >
          <span className="block text-xs font-semibold text-foreground">{entry.term}</span>
          <span className="mt-1 block text-xs leading-relaxed text-foreground-muted">
            {entry.def}
          </span>
        </span>
      )}
    </span>
  );
}

/** `max` overrides the length-based ration — pass `ANNOTATE_ALL` for text that is a list
    of concepts rather than an argument. Left off, the block is rationed by its length. */
export default function GlossaryText({ text, max }: { text: string; max?: number }) {
  const { index } = useGlossary();
  const runs = useMemo(() => annotate(text, index, max), [text, index, max]);
  return (
    <>
      {runs.map((run, i) => {
        /* Runs are positional segments of one immutable string: the array only changes
           when `text` does, and when the question changes a remount is exactly right. */
        if (run.kind === "plain") {
          // biome-ignore lint/suspicious/noArrayIndexKey: see above — the list never reorders.
          return <Fragment key={i}>{run.text}</Fragment>;
        }
        // biome-ignore lint/suspicious/noArrayIndexKey: see above — the list never reorders.
        return <TermTooltip key={i} entry={run.entry} text={run.text} />;
      })}
    </>
  );
}
