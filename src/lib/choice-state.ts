import type { AnswerMode } from "./answer-mode";
import type { AnswerRecord } from "./types";

/* How a choice and a tracker square read at a given moment. This lives here rather
   than in the components because there are no UI tests by design — putting the
   branching in a pure function is the only way it gets covered. */

export type ChoiceState = "idle" | "selected" | "eliminated" | "correct" | "incorrect" | "dimmed";

export interface ChoiceContext {
  correctKey: string;
  answer?: AnswerRecord;
  pending?: string;
  eliminated?: readonly string[];
}

/** Nothing about a choice depends on the correct key until an answer is committed —
    that is what keeps the key from leaking into the UI before the reveal.

    Afterwards the reveal wins over a cross-out, so ruling the right answer out shows
    it as correct *and* struck through. Hiding that would cost the reader the most
    instructive thing on the screen. */
export function choiceState(ctx: ChoiceContext, key: string): ChoiceState {
  const { answer, correctKey, pending, eliminated } = ctx;
  if (!answer) {
    if (eliminated?.includes(key)) return "eliminated";
    return pending === key ? "selected" : "idle";
  }
  if (key === correctKey) return "correct";
  if (key === answer.selected) return "incorrect";
  return "dimmed";
}

export function canSubmit(ctx: ChoiceContext): boolean {
  return !ctx.answer && !!ctx.pending;
}

/** The submit step is what the mode turns on, but a pick left pending by a mid-run
    switch has to stay committable — otherwise flipping to instant would strand it with
    no way to finish the question short of picking again. */
export function showSubmitButton(mode: AnswerMode, ctx: ChoiceContext): boolean {
  if (ctx.answer) return false;
  return mode === "submit" || !!ctx.pending;
}

export type SquareStatus = "unanswered" | "selected" | "correct" | "incorrect";

/** A committed answer always wins: a pending pick can only survive alongside one if a
    reducer guard failed, and reporting the answer is the honest reading either way. */
export function squareStatus(answer: AnswerRecord | undefined, pending?: string): SquareStatus {
  if (answer) return answer.correct ? "correct" : "incorrect";
  return pending ? "selected" : "unanswered";
}
