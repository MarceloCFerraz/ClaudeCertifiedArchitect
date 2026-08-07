import type { AnswerMode } from "../lib/answer-mode";
import { useAnswerMode } from "./answer-mode-provider";

const GLYPHS: Record<AnswerMode, string> = {
  submit: "⏎",
  instant: "⚡",
};

/* "Confirm" rather than "Submit": this sits a few centimetres from the actual
   "Submit answer" button, and two controls with the same verb doing entirely
   different things reads as one of them being broken. */
const LABELS: Record<AnswerMode, string> = {
  submit: "Confirm",
  instant: "Instant",
};

/* Both hints name the current behaviour first and then say "switch to", so the
   button cannot be mistaken for the thing that commits an answer. */
const HINTS: Record<AnswerMode, string> = {
  submit: "Answering: pick a choice, then confirm it. Click to switch to instant reveal.",
  instant: "Answering: a click reveals the answer. Click to switch to pick-then-confirm.",
};

/** Two values, so it is a plain toggle rather than the theme's hover menu. It lives in
    the exam HUD because the setting is worth changing mid-question — the moment you
    want it is usually the moment a click has just cost you a question. */
export default function AnswerModeToggle() {
  const { mode, toggleMode } = useAnswerMode();
  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-pressed={mode === "submit"}
      title={HINTS[mode]}
      aria-label={HINTS[mode]}
      className="shrink-0 rounded border border-stone-700 px-2 py-1 font-mono text-[11px] text-stone-300 transition hover:border-stone-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
    >
      {GLYPHS[mode]}
      {/* The label drops away on a narrow phone rather than pushing the HUD's left
          cluster into the score readout; the glyph alone stays tappable. */}
      <span className="ml-1 hidden sm:inline">{LABELS[mode]}</span>
    </button>
  );
}
