import { buildExam } from "./exam-builder";
import { fileTypeFor, labelFor } from "./report";
import { createRng, randomSeed } from "./rng";
import type { ExamConfig, PreparedQuestion, Session } from "./types";

export const MOCK_SECONDS = 120 * 60; // real exam: 120 minutes

export interface NewExam {
  seed: number;
  questions: PreparedQuestion[];
  session: Session;
  timed: boolean;
  remaining: number;
}

/** Build a fresh exam run (impure: seeds from Math.random and stamps the clock).
    The seed is kept so the same draw can be rebuilt on resume. */
export function createExamSession(config: ExamConfig): NewExam {
  const seed = randomSeed();
  const questions = buildExam(config, createRng(seed));
  const timed = config.mode === "mock";
  const session: Session = {
    label: labelFor(config),
    fileType: fileTypeFor(config),
    count: questions.length,
    createdAt: Date.now(),
    timed,
  };
  return { seed, questions, session, timed, remaining: timed ? MOCK_SECONDS : 0 };
}

/** Reproduce an exam's questions from its persisted (config, seed). */
export function rebuildExam(config: ExamConfig, seed: number): PreparedQuestion[] {
  return buildExam(config, createRng(seed));
}
