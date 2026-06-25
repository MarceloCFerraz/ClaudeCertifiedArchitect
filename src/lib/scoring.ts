import { DOMAINS } from "../data/domains";
import type { Answers, PreparedQuestion } from "./types";

export const PASS_SCORE = 720;
export const READY_SCORE = 900;
export const MIN_SCALED = 100;
export const MAX_SCALED = 1000;

/**
 * "total"   — unanswered questions count as wrong (final result, like the real exam).
 * "answered" — score only what was answered (running estimate / partial report).
 */
export type ScoreBasis = "answered" | "total";

export interface DomainScore {
  domain: number;
  correct: number;
  answered: number;
  total: number;
  ratio: number; // correct / denominator(basis)
}

export interface ExamScore {
  scaled: number;
  weightedRatio: number;
  correct: number;
  answered: number;
  total: number;
  passing: boolean;
  perDomain: DomainScore[];
}

interface DomainTally {
  correct: number;
  answered: number;
  total: number;
}

/**
 * Blueprint-weighted score scaled to 100–1000. Each domain's hit-rate is weighted
 * by its official exam weight, renormalized over the domains present in this exam,
 * so a domain drill reduces to plain ratio and a balanced exam reflects the weights.
 * This is a faithful estimate, not Anthropic's proprietary scaling.
 */
export function scoreExam(
  questions: PreparedQuestion[],
  answers: Answers,
  basis: ScoreBasis = "total",
): ExamScore {
  const tallies = tallyByDomain(questions, answers);

  const perDomain: DomainScore[] = [];
  let weightSum = 0;
  let weightedHits = 0;
  let correct = 0;
  let answered = 0;
  let total = 0;

  for (const [domain, tally] of tallies) {
    const denominator = basis === "answered" ? tally.answered : tally.total;
    const ratio = denominator > 0 ? tally.correct / denominator : 0;
    perDomain.push({
      domain,
      correct: tally.correct,
      answered: tally.answered,
      total: tally.total,
      ratio,
    });
    correct += tally.correct;
    answered += tally.answered;
    total += tally.total;
    // For "answered" basis a domain only counts once it has at least one answer.
    if (basis === "total" || tally.answered > 0) {
      const weight = DOMAINS[domain].weight;
      weightSum += weight;
      weightedHits += weight * ratio;
    }
  }

  const weightedRatio = weightSum > 0 ? weightedHits / weightSum : 0;
  const scaled = clampScaled(Math.round(MIN_SCALED + weightedRatio * (MAX_SCALED - MIN_SCALED)));
  perDomain.sort((a, b) => a.domain - b.domain);

  return {
    scaled,
    weightedRatio,
    correct,
    answered,
    total,
    passing: scaled >= PASS_SCORE,
    perDomain,
  };
}

function tallyByDomain(questions: PreparedQuestion[], answers: Answers): Map<number, DomainTally> {
  const tallies = new Map<number, DomainTally>();
  for (const q of questions) {
    const tally = tallies.get(q.d) ?? { correct: 0, answered: 0, total: 0 };
    tally.total += 1;
    const answer = answers[q.id];
    if (answer) {
      tally.answered += 1;
      if (answer.correct) tally.correct += 1;
    }
    tallies.set(q.d, tally);
  }
  return tallies;
}

function clampScaled(value: number): number {
  return Math.max(MIN_SCALED, Math.min(MAX_SCALED, value));
}
