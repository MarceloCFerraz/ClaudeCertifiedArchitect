import type { Question } from "../data/schema";

export type Mode = "balanced" | "mock" | "scenarios" | "domain" | "scenario";

export type Screen = "home" | "exam" | "results";

export interface ExamConfig {
  mode: Mode;
  length?: number; // balanced
  domain?: number; // domain drill
  scenario?: number; // scenario drill
}

export interface PreparedChoice {
  t: string;
  c?: true;
  k: string; // "A".."D", assigned after the runtime shuffle
}

export interface PreparedQuestion extends Omit<Question, "choices"> {
  choices: PreparedChoice[];
  correctKey: string;
}

export interface AnswerRecord {
  selected: string;
  correct: boolean;
}

export type Answers = Record<string, AnswerRecord>;

export interface Session {
  label: string;
  fileType: string;
  count: number;
  createdAt: number; // epoch ms (serializable for Redux/persist)
  timed: boolean;
}
