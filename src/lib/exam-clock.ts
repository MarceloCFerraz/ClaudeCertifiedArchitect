import type { ExamClock } from "./types";

/* Derives a run's clock from wall time instead of counting ticks. Storing a
   per-second countdown made the timer stall whenever the browser throttled the
   tab, and made a parked run's elapsed time unknowable; here the stored fields
   only move when a segment starts or stops, and `now` is injected so every
   derivation is pure and testable without fake timers. */

function liveSeconds(clock: ExamClock, now: number): number {
  if (clock.runningSince === null) return 0;
  return Math.max(0, (now - clock.runningSince) / 1000);
}

/** Time actually spent on the run: banked segments plus the one in flight. */
export function elapsedAt(clock: ExamClock, now: number): number {
  return Math.round(clock.elapsedSeconds + liveSeconds(clock, now));
}

/** Time left on the budget, or 0 for an untimed run. */
export function remainingAt(clock: ExamClock, now: number): number {
  if (!clock.timed) return 0;
  return Math.max(0, Math.round(clock.remainingSeconds - liveSeconds(clock, now)));
}

/** Bank the segment in flight and stop the clock. Idempotent: folding an
    already-stopped clock returns the same values. */
export function foldClock(clock: ExamClock, now: number): ExamClock {
  return {
    timed: clock.timed,
    elapsedSeconds: elapsedAt(clock, now),
    remainingSeconds: remainingAt(clock, now),
    runningSince: null,
  };
}
