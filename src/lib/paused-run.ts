import { foldClock } from "./exam-clock";
import type { Answers, ExamState, PausedRun } from "./types";

/** Snapshot the live run so it can be parked, stopping its clock at `now`. Returns
    null when there is nothing to park — a finished run, or a slice that was never
    started — so callers can treat "leave" uniformly. */
export function toPausedRun(exam: ExamState, now: number): PausedRun | null {
  const { config, seed, session, questions } = exam;
  if (exam.screen !== "exam" || !config || !session || seed === null) return null;
  if (questions.length === 0) return null;
  return {
    id: `${session.fileType}-${session.createdAt}`,
    config,
    seed,
    session,
    questions,
    idx: exam.idx,
    answers: exam.answers,
    eliminations: exam.eliminations,
    pausedAt: now,
    ...foldClock(exam, now),
  };
}

/** How many questions have been answered — deliberately not `scoreExam`, so listing a
    parked run never reveals how well it is going. */
export function answeredCount(answers: Answers): number {
  return Object.keys(answers).length;
}
