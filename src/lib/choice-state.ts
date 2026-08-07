import type { AnswerRecord } from "./types";

/* How a choice and a tracker square read at a given moment. This lives here rather
   than in the components because there are no UI tests by design — putting the
   branching in a pure function is the only way it gets covered. */

export type ChoiceState = "idle" | "correct" | "incorrect" | "dimmed";

export interface ChoiceContext {
  correctKey: string;
  answer?: AnswerRecord;
}

/** Nothing about a choice depends on the correct key until an answer is committed —
    that is what keeps the key from leaking into the UI before the reveal. */
export function choiceState(ctx: ChoiceContext, key: string): ChoiceState {
  const { answer, correctKey } = ctx;
  if (!answer) return "idle";
  if (key === correctKey) return "correct";
  if (key === answer.selected) return "incorrect";
  return "dimmed";
}

export type SquareStatus = "unanswered" | "correct" | "incorrect";

export function squareStatus(answer: AnswerRecord | undefined): SquareStatus {
  if (!answer) return "unanswered";
  return answer.correct ? "correct" : "incorrect";
}
