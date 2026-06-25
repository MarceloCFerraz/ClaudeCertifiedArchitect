import { scoreExam } from "../lib/scoring";
import { createExamSession } from "../lib/session";
import type { Attempt, ExamConfig } from "../lib/types";
import { examActions } from "./exam-slice";
import { historyActions } from "./history-slice";
import type { AppDispatch, RootState } from "./index";

export const startExam = (config: ExamConfig) => (dispatch: AppDispatch) => {
  const made = createExamSession(config);
  dispatch(examActions.examStarted({ config, ...made }));
};

/** Finish the run: record a compact history attempt (if anything was answered),
    then switch to the results screen. Used by the nav button and timer expiry. */
export const finishExam = () => (dispatch: AppDispatch, getState: () => RootState) => {
  const { exam } = getState();
  if (exam.screen === "results") return;

  const score = scoreExam(exam.questions, exam.answers, "total");
  if (score.answered > 0 && exam.session && exam.config) {
    const attempt: Attempt = {
      id: `${exam.session.fileType}-${exam.session.createdAt}`,
      mode: exam.config.mode,
      label: exam.session.label,
      date: Date.now(),
      scaled: score.scaled,
      passing: score.passing,
      correct: score.correct,
      answered: score.answered,
      total: score.total,
      elapsedSeconds: Math.max(0, Math.round((Date.now() - exam.session.createdAt) / 1000)),
      perDomain: score.perDomain.map((d) => ({
        domain: d.domain,
        correct: d.correct,
        total: d.total,
      })),
    };
    dispatch(historyActions.attemptRecorded(attempt));
  }
  dispatch(examActions.finished());
};
