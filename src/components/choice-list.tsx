import { type ChoiceState, choiceState } from "../lib/choice-state";
import type { AnswerRecord, PreparedQuestion } from "../lib/types";

const ROW_TONE: Record<ChoiceState, string> = {
  idle: "border-border bg-card hover:border-border-hover",
  correct: "border-success-border bg-success-surface",
  incorrect: "border-destructive-border bg-destructive-surface",
  dimmed: "border-border bg-card opacity-70",
};

const BADGE_TONE: Record<ChoiceState, string> = {
  idle: "border-border-strong text-foreground-subtle",
  correct: "border-success bg-success text-white",
  incorrect: "border-destructive bg-destructive text-white",
  dimmed: "border-border-strong text-foreground-subtle",
};

const BADGE_GLYPH: Partial<Record<ChoiceState, string>> = {
  correct: "✓",
  incorrect: "✕",
};

export default function ChoiceList({
  q,
  answer,
  onChoose,
}: {
  q: PreparedQuestion;
  answer?: AnswerRecord;
  onChoose: (key: string) => void;
}) {
  const isAnswered = !!answer;
  return (
    <div className="mt-4 space-y-2.5">
      {q.choices.map((c) => {
        const state = choiceState({ correctKey: q.correctKey, answer }, c.k);
        return (
          <button
            type="button"
            key={c.k}
            disabled={isAnswered}
            onClick={() => onChoose(c.k)}
            className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid ${
              ROW_TONE[state]
            }${isAnswered ? " cursor-default" : ""}`}
          >
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-bold ${BADGE_TONE[state]}`}
            >
              {BADGE_GLYPH[state] ?? c.k}
            </span>
            <span className="text-sm leading-relaxed text-foreground">{c.t}</span>
          </button>
        );
      })}
    </div>
  );
}
