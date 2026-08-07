import type { AnswerMode } from "../lib/answer-mode";
import { type ChoiceState, choiceState, showSubmitButton } from "../lib/choice-state";
import type { AnswerRecord, PreparedChoice, PreparedQuestion } from "../lib/types";
import { Icon } from "./atoms";

/* A pending pick is brand orange rather than green or red: any success/destructive
   tone before the reveal would read as a verdict on the choice. */
const ROW_TONE: Record<ChoiceState, string> = {
  idle: "border-border bg-card hover:border-border-hover",
  selected: "border-brand-border bg-brand-surface",
  eliminated: "border-border-subtle bg-muted",
  correct: "border-success-border bg-success-surface",
  incorrect: "border-destructive-border bg-destructive-surface",
  dimmed: "border-border bg-card opacity-70",
};

const BADGE_TONE: Record<ChoiceState, string> = {
  idle: "border-border-strong text-foreground-subtle",
  selected: "border-brand-vivid bg-brand-vivid text-white",
  eliminated: "border-border text-foreground-faint",
  correct: "border-success bg-success text-white",
  incorrect: "border-destructive bg-destructive text-white",
  dimmed: "border-border-strong text-foreground-subtle",
};

const TEXT_TONE: Record<ChoiceState, string> = {
  idle: "text-foreground",
  selected: "text-brand-on-surface",
  eliminated: "text-foreground-faint",
  correct: "text-foreground",
  incorrect: "text-foreground",
  dimmed: "text-foreground",
};

/* The badge keeps the letter until the answer is in — any distinct glyph beforehand
   would read as a hint about the choice it sits on. */
const BADGE_GLYPH: Partial<Record<ChoiceState, string>> = {
  correct: "✓",
  incorrect: "✕",
};

/* The row is tall enough to hold the badge and the scissors stacked beneath it, and
   the scissors is placed against that same box: 12px of row padding, the badge's 2px
   nudge and 24px height, then a 4px gap. Centred under a 24px badge, a 20px button
   sits 2px in from the row's 16px padding. */
const ROW_MIN_HEIGHT = "min-h-[4.75rem]";
const SCISSORS_POSITION = "left-[1.125rem] top-[2.625rem]";

function ChoiceRow({
  choice,
  state,
  answered,
  onChoose,
  onToggleEliminate,
}: {
  choice: PreparedChoice;
  state: ChoiceState;
  answered: boolean;
  onChoose: () => void;
  onToggleEliminate: () => void;
}) {
  const isEliminated = state === "eliminated";
  const locked = answered || isEliminated;
  return (
    <div className="relative">
      {/* The choice button comes first so Tab reaches the option before its cross-out,
          and so the scissors — a later sibling, never a child — paints over the row
          and stays clickable while the option itself is disabled. */}
      <button
        type="button"
        data-choice
        disabled={locked}
        onClick={onChoose}
        className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid ${ROW_MIN_HEIGHT} ${
          ROW_TONE[state]
        }${locked ? " cursor-default" : ""}`}
      >
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-bold ${BADGE_TONE[state]}`}
        >
          {BADGE_GLYPH[state] ?? choice.k}
        </span>
        <span
          className={`text-sm leading-relaxed ${TEXT_TONE[state]}${isEliminated ? " line-through" : ""}`}
        >
          {choice.t}
        </span>
      </button>
      {/* The label names the choice and never changes — `aria-pressed` already carries
          the state, and relabelling it on toggle is what makes a toggle unreadable. */}
      <button
        type="button"
        data-choice
        disabled={answered}
        aria-pressed={isEliminated}
        aria-label={`Cross out choice ${choice.k}`}
        title={isEliminated ? "Bring this option back" : "Rule this option out"}
        onClick={onToggleEliminate}
        className={`absolute ${SCISSORS_POSITION} flex h-5 w-5 items-center justify-center rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid disabled:cursor-default ${
          isEliminated
            ? "text-destructive-text hover:bg-destructive-surface"
            : "text-foreground-faint hover:bg-foreground/10 hover:text-foreground-muted"
        }`}
      >
        <Icon className="h-3.5 w-3.5">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
        </Icon>
      </button>
    </div>
  );
}

export default function ChoiceList({
  q,
  mode,
  answer,
  pending,
  eliminated,
  onChoose,
  onToggleEliminate,
  onSubmit,
}: {
  q: PreparedQuestion;
  mode: AnswerMode;
  answer?: AnswerRecord;
  pending?: string;
  eliminated: readonly string[];
  onChoose: (key: string) => void;
  onToggleEliminate: (key: string) => void;
  onSubmit: () => void;
}) {
  const ctx = { correctKey: q.correctKey, answer, pending, eliminated };
  return (
    <div className="mt-4 space-y-2.5">
      {q.choices.map((c) => (
        <ChoiceRow
          key={c.k}
          choice={c}
          state={choiceState(ctx, c.k)}
          answered={!!answer}
          onChoose={() => onChoose(c.k)}
          onToggleEliminate={() => onToggleEliminate(c.k)}
        />
      ))}
      {showSubmitButton(mode, ctx) && (
        <button
          type="button"
          disabled={!pending}
          onClick={onSubmit}
          title={pending ? "Commit this answer and see the explanation" : "Pick an option first"}
          className={`w-full rounded-lg border px-5 py-3 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid ${
            pending
              ? "border-brand-vivid bg-brand-vivid text-white hover:border-brand-bright hover:bg-brand-bright"
              : "cursor-not-allowed border-border text-foreground-disabled"
          }`}
        >
          {pending ? `Submit answer · ${pending}` : "Submit answer"}
        </button>
      )}
    </div>
  );
}
