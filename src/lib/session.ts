import { buildExam } from "./exam-builder";
import { fileTypeFor, labelFor } from "./report";
import { createRng, randomSeed } from "./rng";
import type { ExamConfig, PreparedQuestion, Session } from "./types";

export const SECONDS_PER_QUESTION = 120; // real exam: 120 minutes / 60 questions

export interface NewExam {
  seed: number;
  questions: PreparedQuestion[];
  session: Session;
  timed: boolean;
  remaining: number;
}

/** Build a fresh exam run (impure: seeds from Math.random and stamps the clock).
    The seed is kept so the same draw can be rebuilt on resume. The full mock is
    always timed; other modes are timed only when the user opts in. */
export function createExamSession(config: ExamConfig): NewExam {
  const seed = randomSeed();
  const questions = buildExam(config, createRng(seed));
  const timed = config.mode === "mock" || config.timed === true;
  const session: Session = {
    label: labelFor(config),
    fileType: fileTypeFor(config),
    count: questions.length,
    createdAt: Date.now(),
    timed,
  };
  const remaining = timed ? questions.length * SECONDS_PER_QUESTION : 0;
  return { seed, questions, session, timed, remaining };
}

/** Reproduce an exam's questions from its persisted (config, seed). */
export function rebuildExam(config: ExamConfig, seed: number): PreparedQuestion[] {
  return buildExam(config, createRng(seed));
}
