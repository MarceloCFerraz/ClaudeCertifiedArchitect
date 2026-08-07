import type { Question } from "../data/schema";

export type Mode = "balanced" | "mock" | "scenarios" | "domain" | "scenario";

export type Screen = "home" | "exam" | "results";

export interface ExamConfig {
  mode: Mode;
  length?: number; // balanced
  domain?: number; // domain drill
  scenario?: number; // scenario drill
  timed?: boolean; // opt-in timer for non-mock modes (the full mock is always timed)
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

/** Choices the reader has ruled out, by question id — a scratchpad, never scored.
    The letters are kept sorted so one logical state always serializes to the same
    bytes, and a question with nothing crossed out carries no entry at all: an
    `undefined` value would survive in memory but vanish through JSON, leaving
    "has an entry" true before a reload and false after it. */
export type Eliminations = Record<string, string[]>;

/** Wall-clock bookkeeping for a run. Time is never counted by ticking a stored
    counter: `runningSince` marks when the live segment began, and elapsed/remaining
    are derived from it, so a closed tab or a throttled background timer cannot
    silently drift. A parked run has `runningSince === null` — its clock is stopped. */
export interface ExamClock {
  timed: boolean;
  elapsedSeconds: number; // completed segments only
  remainingSeconds: number; // budget left as of `runningSince`; 0 when untimed
  runningSince: number | null; // epoch ms this segment started; null when parked
}

export interface Session {
  label: string;
  fileType: string;
  count: number;
  createdAt: number; // epoch ms (serializable for Redux/persist)
  timed: boolean;
}

/** The live run. Lives here rather than in the slice so `src/lib/` helpers can take
    it without importing from `src/store/`. */
export interface ExamState extends ExamClock {
  screen: Screen;
  config: ExamConfig | null;
  seed: number | null;
  session: Session | null;
  questions: PreparedQuestion[];
  idx: number;
  answers: Answers;
  eliminations: Eliminations;
}

/** A run parked mid-way. It carries its own draw: the questions are replayed exactly
    as they were dealt and are never rebuilt from the seed, so editing the bank cannot
    re-point a stored answer — `AnswerRecord.selected` is a positional letter assigned
    after the shuffle — at different text. */
export interface PausedRun extends ExamClock {
  id: string; // `${session.fileType}-${session.createdAt}` — stable across pause → resume → pause
  config: ExamConfig;
  seed: number;
  session: Session;
  questions: PreparedQuestion[];
  idx: number;
  answers: Answers;
  // Optional because runs parked by an earlier build are rehydrated verbatim out of
  // the persisted array and simply do not have them. `examResumed` defaults them.
  eliminations?: Eliminations;
  pausedAt: number; // epoch ms
}

export interface AttemptDomain {
  domain: number;
  correct: number;
  total: number;
}

/** Compact record of a finished exam — no question text, so history stays small. */
export interface Attempt {
  id: string;
  mode: Mode;
  label: string;
  date: number; // epoch ms
  scaled: number;
  passing: boolean;
  correct: number;
  answered: number;
  total: number;
  elapsedSeconds: number;
  perDomain: AttemptDomain[];
}
