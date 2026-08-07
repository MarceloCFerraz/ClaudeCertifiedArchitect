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

/** Commit whatever is pending on a question. A no-op when nothing is, which is what
    makes it safe to fire from a keypress that may also have activated a button. */
export const submitAnswer =
  (qid: string, now = Date.now()) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    const { exam } = getState();
    const selected = exam.selections[qid];
    const question = exam.questions.find((q) => q.id === qid);
    if (!selected || !question) return;
    dispatch(answerQuestion(qid, selected, selected === question.correctKey, now));
  };

/** Register a click on a choice. Instant mode is "select, then commit in the same
    breath" rather than a second path into `answered`, so the guards that refuse a
    crossed-out or already-answered choice live in one reducer instead of two places. */
export const chooseChoice =
  (qid: string, key: string, commitNow: boolean, now = Date.now()) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    // Re-clicking a pick takes it back — except on a click that also commits, where
    // taking it back first would leave nothing to submit and the click would do
    // nothing at all. That is reachable: switching to instant mode mid-question
    // leaves a pick pending, and clicking it is how you would expect to confirm it.
    if (!commitNow || getState().exam.selections[qid] !== key) {
      dispatch(examActions.selectionMade({ qid, selected: key }));
    }
    if (commitNow) dispatch(submitAnswer(qid, now));
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
