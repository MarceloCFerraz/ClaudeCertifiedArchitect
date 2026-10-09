import { BANK } from "../../src/data/questions";
import {
  allocateByWeight,
  buildExam,
  MOCK_LEN,
  prepareQuestion,
  shuffle,
} from "../../src/lib/exam-builder";

/** Deterministic PRNG so draws are repeatable under test. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function countByDomain(exam: { d: number }[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const q of exam) out[q.d] = (out[q.d] ?? 0) + 1;
  return out;
}

describe("shuffle", () => {
  it("returns a permutation without mutating the input", () => {
    const input = [1, 2, 3, 4, 5];
    const out = shuffle(input, mulberry32(1));
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it("is deterministic for a given seed", () => {
    expect(shuffle([1, 2, 3, 4, 5, 6, 7, 8], mulberry32(42))).toEqual(
      shuffle([1, 2, 3, 4, 5, 6, 7, 8], mulberry32(42)),
    );
  });
});

describe("allocateByWeight", () => {
  it("allocates a 60-question mock by domain weight", () => {
    expect(allocateByWeight(60)).toEqual({ 1: 16, 2: 11, 3: 12, 4: 12, 5: 9 });
  });

  it("sums to the requested total for every exam size", () => {
    for (const total of [12, 24, 40, 60]) {
      const sum = Object.values(allocateByWeight(total)).reduce((s, n) => s + n, 0);
      expect(sum).toBe(total);
    }
  });
});

describe("prepareQuestion", () => {
  it("tags choices A–D and points correctKey at the correct choice", () => {
    const source = BANK.find((x) => x.id === "S1Q1");
    if (!source) throw new Error("fixture S1Q1 missing");
    const prepared = prepareQuestion(source, mulberry32(7));
    expect(prepared.choices.map((c) => c.k)).toEqual(["A", "B", "C", "D"]);
    const correct = prepared.choices.find((c) => c.k === prepared.correctKey);
    expect(correct?.c).toBe(true);
  });
});

describe("buildExam", () => {
  it("draws a 60-question mock weighted by domain", () => {
    const exam = buildExam({ mode: "mock" }, mulberry32(3));
    expect(exam).toHaveLength(MOCK_LEN);
    expect(countByDomain(exam)).toEqual({ 1: 16, 2: 11, 3: 12, 4: 12, 5: 9 });
  });

  it("biases the mock toward hard questions", () => {
    const exam = buildExam({ mode: "mock" }, mulberry32(9));
    expect(exam.filter((q) => q.diff === "hard").length).toBeGreaterThan(0);
  });

  it("draws a balanced exam of the requested length", () => {
    expect(buildExam({ mode: "balanced", length: 24 }, mulberry32(3))).toHaveLength(24);
  });

  it("restricts a domain drill to that domain", () => {
    const exam = buildExam({ mode: "domain", domain: 2 }, mulberry32(1));
    expect(exam.length).toBeGreaterThan(0);
    expect(exam.every((q) => q.d === 2)).toBe(true);
  });

  it("restricts a scenario drill to that scenario", () => {
    const exam = buildExam({ mode: "scenario", scenario: 3 }, mulberry32(1));
    expect(exam.every((q) => q.s === 3)).toBe(true);
  });

  it("draws exactly four scenarios for a scenario mock", () => {
    const exam = buildExam({ mode: "scenarios" }, mulberry32(5));
    expect(new Set(exam.map((q) => q.s)).size).toBe(4);
  });

  it("puts every bank question exactly once into a hardcore exam", () => {
    const exam = buildExam({ mode: "hardcore" }, mulberry32(4));
    expect(exam.map((q) => q.id).sort()).toEqual(BANK.map((q) => q.id).sort());
  });

  it("covers every scenario and domain in a hardcore exam", () => {
    const exam = buildExam({ mode: "hardcore" }, mulberry32(4));
    expect(new Set(exam.map((q) => q.s)).size).toBe(6);
    expect(new Set(exam.map((q) => q.d)).size).toBe(5);
  });

  it("keeps a hardcore exam grouped by scenario", () => {
    const exam = buildExam({ mode: "hardcore" }, mulberry32(4));
    const runs = exam.filter((q, i) => i === 0 || exam[i - 1].s !== q.s);
    expect(runs).toHaveLength(6);
  });

  it("is deterministic for a given seed", () => {
    const a = buildExam({ mode: "balanced", length: 12 }, mulberry32(11)).map((q) => q.id);
    const b = buildExam({ mode: "balanced", length: 12 }, mulberry32(11)).map((q) => q.id);
    expect(a).toEqual(b);
  });
});
