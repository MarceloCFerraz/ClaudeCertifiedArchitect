import type { AnswerMode } from "../lib/answer-mode";
import { useAnswerMode } from "./answer-mode-provider";

const GLYPHS: Record<AnswerMode, string> = {
  submit: "⏎",
  instant: "⚡",
};

const LABELS: Record<AnswerMode, string> = {
  submit: "Submit",
  instant: "Instant",
};

const HINTS: Record<AnswerMode, string> = {
  submit: "Answering: pick a choice, then submit it. Click to reveal on click instead.",
  instant: "Answering: a click reveals the answer. Click to pick and submit separately.",
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
