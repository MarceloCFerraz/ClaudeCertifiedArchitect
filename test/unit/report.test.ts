import { buildReport, fileTypeFor, labelFor, reportFileName } from "../../src/lib/report";
import type { Answers, PreparedQuestion, Session } from "../../src/lib/types";

const question: PreparedQuestion = {
  id: "S1Q1",
  s: 1,
  d: 1,
  ts: "1.4",
  q: "What is the best fix?",
  exp: "Because programmatic enforcement is deterministic.",
  correctKey: "A",
  choices: [
    { t: "A gate/hook", k: "A", c: true },
    { t: "More emphatic prompt", k: "B" },
    { t: "Temperature 0", k: "C" },
    { t: "One few-shot example", k: "D" },
  ],
};

const session: Session = {
  label: "Mock exam (60 questions · timed · hard)",
  fileType: "mock",
  count: 60,
  createdAt: new Date(2026, 5, 24, 22, 31, 5).getTime(),
  timed: true,
};

describe("fileTypeFor", () => {
  it("maps each mode to a filename token", () => {
    expect(fileTypeFor({ mode: "mock" })).toBe("mock");
    expect(fileTypeFor({ mode: "balanced", length: 24 })).toBe("balanced");
    expect(fileTypeFor({ mode: "scenarios" })).toBe("scenarios");
    expect(fileTypeFor({ mode: "domain", domain: 3 })).toBe("domain-d3");
    expect(fileTypeFor({ mode: "scenario", scenario: 2 })).toBe("scenario-2");
  });
});

describe("labelFor", () => {
  it("labels a balanced exam with its length", () => {
    expect(labelFor({ mode: "balanced", length: 24 })).toBe("Balanced exam (24 questions)");
  });
  it("labels a domain drill with the domain name", () => {
    expect(labelFor({ mode: "domain", domain: 1 })).toContain(
      "Agentic Architecture & Orchestration",
    );
  });
});

describe("reportFileName", () => {
  it("encodes type, count and start timestamp", () => {
    expect(reportFileName(session)).toBe("mock-60q-20260624-223105.txt");
  });
});

describe("buildReport", () => {
  it("includes the score header and the answered question detail", () => {
    const answers: Answers = { S1Q1: { selected: "B", correct: false } };
    const report = buildReport(session, [question], answers);
    expect(report).toContain("Correct: 0/1");
    expect(report).toContain("Estimated scaled score: 100");
    expect(report).toContain("What is the best fix?");
    expect(report).toContain("Your answer:    B) More emphatic prompt");
    expect(report).toContain("Correct answer: A) A gate/hook");
    expect(report).toContain("Explanation: Because programmatic enforcement is deterministic.");
  });

  it("omits unanswered questions from the detail", () => {
    const report = buildReport(session, [question], {});
    expect(report).toContain("Answered: 0/60");
    expect(report).not.toContain("What is the best fix?");
  });
});
