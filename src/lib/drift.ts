import type { Choice, Question } from "../data/schema";
import type { PreparedChoice, PreparedQuestion } from "./types";

/* A parked run always replays its own snapshot, so editing the bank can never change
   what it asks. Drift is therefore informational: it tells the user their saved run is
   no longer the current material, and lets them decide whether to keep or delete it. */

export interface Drift {
  removed: number; // questions no longer in the bank
  changed: number; // questions whose content was edited since the draw
}

function correctText(choices: readonly (PreparedChoice | Choice)[]): string | undefined {
  return choices.find((c) => c.c === true)?.t;
}

/** Compares choices as a set — the snapshot is shuffled, so order says nothing. */
function sameChoices(snapshot: readonly PreparedChoice[], current: readonly Choice[]): boolean {
  if (snapshot.length !== current.length) return false;
  const before = snapshot.map((c) => c.t).sort();
  const after = current.map((c) => c.t).sort();
  if (before.some((text, i) => text !== after[i])) return false;
  return correctText(snapshot) === correctText(current);
}

/* `d` and `s` count as changes: a reassigned domain silently skews the per-domain
   breakdown the results screen builds from the snapshot. */
function hasChanged(snapshot: PreparedQuestion, current: Question): boolean {
  return (
    snapshot.q !== current.q ||
    snapshot.exp !== current.exp ||
    snapshot.d !== current.d ||
    snapshot.s !== current.s ||
    !sameChoices(snapshot.choices, current.choices)
  );
}

export function detectDrift(
  questions: readonly PreparedQuestion[],
  bank: readonly Question[],
): Drift {
  const current = new Map(bank.map((q) => [q.id, q]));
  const paired = questions.map((snapshot) => ({ snapshot, current: current.get(snapshot.id) }));
  return {
    removed: paired.filter((p) => !p.current).length,
    changed: paired.filter((p) => p.current && hasChanged(p.snapshot, p.current)).length,
  };
}

export function hasDrift(drift: Drift): boolean {
  return drift.removed > 0 || drift.changed > 0;
}
