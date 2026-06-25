import { DOMAINS } from "../data/domains";
import { SCENARIOS } from "../data/scenarios";
import { stamp } from "./format";
import { PASS_SCORE, scoreExam } from "./scoring";
import type { Answers, ExamConfig, PreparedQuestion, Session } from "./types";

export function fileTypeFor(config: ExamConfig): string {
  switch (config.mode) {
    case "mock":
      return "mock";
    case "balanced":
      return "balanced";
    case "scenarios":
      return "scenarios";
    case "domain":
      return `domain-d${config.domain}`;
    case "scenario":
      return `scenario-${config.scenario}`;
    default:
      return "exam";
  }
}

export function labelFor(config: ExamConfig): string {
  switch (config.mode) {
    case "mock":
      return "Mock exam (60 questions · timed · hard)";
    case "balanced":
      return `Balanced exam (${config.length} questions)`;
    case "scenarios":
      return "Scenario mock (4 of 6)";
    case "domain":
      return `Drill · ${DOMAINS[config.domain ?? 0]?.name ?? `Domain ${config.domain}`}`;
    case "scenario":
      return `Drill · Scenario ${config.scenario}: ${SCENARIOS[config.scenario ?? 0]?.title ?? ""}`;
    default:
      return "Exam";
  }
}

export function reportFileName(session: Session): string {
  return `${session.fileType}-${session.count}q-${stamp(session.createdAt)}.txt`;
}

export function buildReport(
  session: Session,
  questions: PreparedQuestion[],
  answers: Answers,
): string {
  const answeredQuestions = questions.filter((q) => answers[q.id]);
  const score = scoreExam(questions, answers, "answered");
  const lines: string[] = [];

  lines.push("Claude Certified Architect – Foundations · Result");
  lines.push(`Type: ${session.label}`);
  lines.push(`Questions in exam: ${session.count}`);
  lines.push(`Created at: ${session.createdAt.toLocaleString()}`);
  lines.push(`Answered: ${answeredQuestions.length}/${session.count}`);
  lines.push(
    `Correct: ${score.correct}/${answeredQuestions.length}  ·  Estimated scaled score: ${score.scaled}  ·  Passing: ${PASS_SCORE}`,
  );
  lines.push("=".repeat(72));

  answeredQuestions.forEach((q, i) => {
    const answer = answers[q.id];
    const chosen = q.choices.find((c) => c.k === answer.selected);
    const correctChoice = q.choices.find((c) => c.k === q.correctKey);
    const hard = q.diff === "hard" ? " · hard" : "";
    lines.push("");
    lines.push(
      `Q${i + 1}  [D${q.d} · Scenario ${q.s} · TS ${q.ts}${hard}]  ${answer.correct ? "✔ correct" : "✘ wrong"}`,
    );
    lines.push(q.q);
    for (const c of q.choices) lines.push(`   ${c.k}) ${c.t}`);
    lines.push(`Your answer:    ${answer.selected}) ${chosen?.t ?? ""}`);
    lines.push(`Correct answer: ${q.correctKey}) ${correctChoice?.t ?? ""}`);
    lines.push(`Explanation: ${q.exp}`);
  });

  return lines.join("\n");
}
