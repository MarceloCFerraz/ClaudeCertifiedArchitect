import { elapsedAt } from "../lib/exam-clock";
import { toPausedRun } from "../lib/paused-run";
import { scoreExam } from "../lib/scoring";
import { createExamSession } from "../lib/session";
import type { Attempt, ExamConfig } from "../lib/types";
import { examActions } from "./exam-slice";
import { historyActions } from "./history-slice";
import type { AppDispatch, RootState } from "./index";
import { pausedActions } from "./paused-slice";

export const startExam = (config: ExamConfig) => (dispatch: AppDispatch) => {
  const made = createExamSession(config);
  dispatch(examActions.examStarted({ config, ...made }));
};

/** Record an answer and checkpoint the clock in one step, so the two never diverge. */
export const answerQuestion =
  (qid: string, selected: string, correct: boolean, now = Date.now()) =>
  (dispatch: AppDispatch) => {
    dispatch(examActions.answered({ qid, selected, correct }));
    dispatch(examActions.clockCheckpointed(now));
  };

/** Finish the run: record a compact history attempt (if anything was answered),
    then switch to the results screen. Used by the nav button and timer expiry. */
export const finishExam =
  (now = Date.now()) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    const { exam } = getState();
    if (exam.screen === "results") return;

    const score = scoreExam(exam.questions, exam.answers, "total");
    if (score.answered > 0 && exam.session && exam.config) {
      const attempt: Attempt = {
        id: `${exam.session.fileType}-${exam.session.createdAt}`,
        mode: exam.config.mode,
        label: exam.session.label,
        date: now,
        scaled: score.scaled,
        passing: score.passing,
        correct: score.correct,
        answered: score.answered,
        total: score.total,
        // Time actually spent, not wall time since the run began — a run that was
        // parked overnight would otherwise report the whole night.
        elapsedSeconds: elapsedAt(exam, now),
        perDomain: score.perDomain.map((d) => ({
          domain: d.domain,
          correct: d.correct,
          total: d.total,
        })),
      };
      dispatch(historyActions.attemptRecorded(attempt));
    }
    dispatch(examActions.finished(now));
  };

/** Park the run so it can be picked up later, and return to the home screen. */
export const pauseExam =
  (now = Date.now()) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    const run = toPausedRun(getState().exam, now);
    if (run) dispatch(pausedActions.runPaused(run));
    dispatch(examActions.examCleared());
  };

export const resumeRun =
  (id: string, now = Date.now()) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    const run = getState().paused.runs.find((r) => r.id === id);
    if (!run) return;
    // Park whatever is live first: the home screen can't reach this while a run is in
    // progress, but the thunk shouldn't depend on that to avoid destroying work.
    const live = toPausedRun(getState().exam, now);
    if (live && live.id !== id) dispatch(pausedActions.runPaused(live));
    // Load before discarding — interrupted between the two, the run is duplicated
    // rather than lost.
    dispatch(examActions.examResumed({ run, now }));
    dispatch(pausedActions.runDiscarded(id));
  };
