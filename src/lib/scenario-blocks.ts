import type { PreparedQuestion } from "./types";

export interface ScenarioBlockItem {
  q: PreparedQuestion;
  index: number; // global position in the original questions array
}

export interface ScenarioBlock {
  s: number; // actual scenario number (q.s)
  questions: ScenarioBlockItem[]; // 1-based array position = display number Q1..Qn
}

/**
 * Group a prepared exam into contiguous scenario blocks, in encounter order.
 *
 * Questions are always contiguous by scenario (see `buildExam`), so a run-scan
 * over `q.s` yields one block per scenario while preserving the per-run random
 * block order. Each item carries its global `index` so a tracker click can jump
 * straight to that question, and its 1-based position within a block gives the
 * per-scenario question number that resets each block.
 */
export function scenarioBlocks(questions: PreparedQuestion[]): ScenarioBlock[] {
  const blocks: ScenarioBlock[] = [];
  questions.forEach((q, index) => {
    const last = blocks[blocks.length - 1];
    if (last && last.s === q.s) last.questions.push({ q, index });
    else blocks.push({ s: q.s, questions: [{ q, index }] });
  });
  return blocks;
}
