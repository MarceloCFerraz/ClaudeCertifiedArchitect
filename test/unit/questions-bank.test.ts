import { DOMAINS } from "../../src/data/domains";
import { BANK } from "../../src/data/questions";
import { SCENARIOS } from "../../src/data/scenarios";
import { bankSchema } from "../../src/data/schema";

const MOCK_LEN = 60;

describe("question bank schema", () => {
  it("validates every question against the Zod schema", () => {
    const result = bankSchema.safeParse(BANK);
    expect(result.success).toBe(true);
  });
});

describe("question bank integrity", () => {
  it("has 92 questions", () => {
    expect(BANK).toHaveLength(92);
  });

  it("has unique question ids", () => {
    const ids = BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every question exactly one correct choice", () => {
    const offenders = BANK.filter((q) => q.choices.filter((c) => c.c === true).length !== 1).map(
      (q) => q.id,
    );
    expect(offenders).toEqual([]);
  });

  it("gives every question exactly four choices", () => {
    const offenders = BANK.filter((q) => q.choices.length !== 4).map((q) => q.id);
    expect(offenders).toEqual([]);
  });

  it("references only defined domains", () => {
    const offenders = BANK.filter((q) => !DOMAINS[q.d]).map((q) => q.id);
    expect(offenders).toEqual([]);
  });

  it("references only defined scenarios", () => {
    const offenders = BANK.filter((q) => !SCENARIOS[q.s]).map((q) => q.id);
    expect(offenders).toEqual([]);
  });

  it("holds enough questions per domain to fill a weighted 60-question mock", () => {
    const shortfalls = Object.entries(DOMAINS)
      .map(([id, domain]) => {
        const available = BANK.filter((q) => q.d === Number(id)).length;
        const maxNeeded = Math.ceil((domain.weight / 100) * MOCK_LEN);
        return { domain: id, available, maxNeeded };
      })
      .filter((d) => d.available < d.maxNeeded);
    expect(shortfalls).toEqual([]);
  });
});
