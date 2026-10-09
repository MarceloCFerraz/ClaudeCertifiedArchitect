import { DOMAINS } from "../data/domains";
import { BANK } from "../data/questions";
import type { Question } from "../data/schema";
import type { ExamConfig, PreparedChoice, PreparedQuestion } from "./types";

export const MOCK_LEN = 60; // matches the real exam: 60 questions / 120 minutes

const LETTERS = ["A", "B", "C", "D"];
const ALL_DOMAINS = [1, 2, 3, 4, 5];
const ALL_SCENARIOS = [1, 2, 3, 4, 5, 6];

/** Injectable RNG so draws and shuffles are deterministic under test. */
export type Rng = () => number;

export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Shuffle a question's choices and tag them A–D, recording the correct key. */
export function prepareQuestion(q: Question, rng: Rng = Math.random): PreparedQuestion {
  const shuffled = shuffle(q.choices, rng);
  const choices: PreparedChoice[] = shuffled.map((c, i) => ({ ...c, k: LETTERS[i] }));
  const correct = choices.find((c) => c.c === true);
  if (!correct) throw new Error(`question ${q.id} has no correct choice`);
  return { ...q, choices, correctKey: correct.k };
}

/** Largest-remainder allocation of `total` across the five domains by weight. */
export function allocateByWeight(total: number): Record<number, number> {
  const exact = ALL_DOMAINS.map((id) => ({ id, value: (DOMAINS[id].weight / 100) * total }));
  const floored = exact.map((r) => ({ id: r.id, base: Math.floor(r.value), rem: r.value % 1 }));
  const used = floored.reduce((sum, r) => sum + r.base, 0);
  const left = total - used;
  const byRemainder = [...floored].sort((a, b) => b.rem - a.rem);
  const counts: Record<number, number> = {};
  for (const r of floored) counts[r.id] = r.base;
  for (let i = 0; i < left; i++) counts[byRemainder[i % byRemainder.length].id] += 1;
  return counts;
}

/** Weighted draw across domains; preferHard pulls hard questions first per domain. */
export function pickByWeight(
  total: number,
  preferHard: boolean,
  rng: Rng = Math.random,
): Question[] {
  const counts = allocateByWeight(total);
  const out: Question[] = [];
  for (const d of ALL_DOMAINS) {
    const pool = BANK.filter((q) => q.d === d);
    const hard = shuffle(
      pool.filter((q) => q.diff === "hard"),
      rng,
    );
    const standard = shuffle(
      pool.filter((q) => q.diff !== "hard"),
      rng,
    );
    const ordered = preferHard ? [...hard, ...standard] : [...standard, ...hard];
    out.push(...ordered.slice(0, counts[d]));
  }
  return out;
}

export function buildExam(config: ExamConfig, rng: Rng = Math.random): PreparedQuestion[] {
  const selected = selectQuestions(config, rng);
  // Group by scenario for natural framing, with the scenarios in a random order.
  const scenarioOrder = shuffle(ALL_SCENARIOS, rng);
  const ordered = [...selected].sort(
    (a, b) => scenarioOrder.indexOf(a.s) - scenarioOrder.indexOf(b.s),
  );
  return ordered.map((q) => prepareQuestion(q, rng));
}

function selectQuestions(config: ExamConfig, rng: Rng): Question[] {
  switch (config.mode) {
    case "mock":
      return pickByWeight(MOCK_LEN, true, rng);
    case "balanced":
      return pickByWeight(config.length ?? 24, false, rng);
    case "scenarios": {
      const scenarios = shuffle(ALL_SCENARIOS, rng).slice(0, 4);
      return BANK.filter((q) => scenarios.includes(q.s));
    }
    case "domain":
      return BANK.filter((q) => q.d === config.domain);
    case "scenario":
      return BANK.filter((q) => q.s === config.scenario);
    case "hardcore":
      return [...BANK];
    default:
      return [...BANK];
  }
}
