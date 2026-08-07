import { useMemo, useState } from "react";
import { BANK } from "../data/questions";
import { detectDrift, hasDrift } from "../lib/drift";
import { fmtTime } from "../lib/format";
import { answeredCount } from "../lib/paused-run";
import type { PausedRun } from "../lib/types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { MAX_PAUSED, pausedActions } from "../store/paused-slice";
import { resumeRun } from "../store/thunks";
import { Bar } from "./atoms";

function driftNote(run: PausedRun): string | null {
  const drift = detectDrift(run.questions, BANK);
  if (!hasDrift(drift)) return null;
  const parts = [
    drift.removed > 0 ? `${drift.removed} removed from the bank` : null,
    drift.changed > 0 ? `${drift.changed} edited since` : null,
  ].filter(Boolean);
  return `${parts.join(", ")} — this run still replays exactly as you drew it.`;
}

export function PausedPanel() {
  const dispatch = useAppDispatch();
  const runs = useAppSelector((s) => s.paused.runs);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  // A full-text comparison per question, on a screen that re-renders freely.
  const notes = useMemo(() => new Map(runs.map((run) => [run.id, driftNote(run)])), [runs]);
  if (runs.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      <h2 className="font-mono text-xs uppercase tracking-widest text-foreground-faint">
        Paused exams
      </h2>

      <div className="mt-3 space-y-3">
        {runs.map((run) => {
          const answered = answeredCount(run.answers);
          const total = run.questions.length;
          const note = notes.get(run.id);
          return (
            <div
              key={run.id}
              className="border-t border-border-subtle pt-3 text-sm first:border-0 first:pt-0"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-foreground-muted">{run.session.label}</div>
                  <div className="font-mono text-[11px] text-foreground-faint">
                    {answered}/{total} answered · ⏱{" "}
                    {run.timed
                      ? `${fmtTime(run.remainingSeconds)} left`
                      : fmtTime(run.elapsedSeconds)}{" "}
                    · paused {new Date(run.pausedAt).toLocaleString()}
                  </div>
                </div>

                {confirmingId === run.id ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[11px] text-foreground-faint">Delete?</span>
                    <button
                      type="button"
                      onClick={() => dispatch(pausedActions.runDiscarded(run.id))}
                      className="rounded-md border border-destructive-border px-2.5 py-1 font-mono text-[11px] text-destructive-text transition hover:bg-destructive-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="rounded-md border border-border-strong px-2.5 py-1 font-mono text-[11px] text-foreground-muted transition hover:border-border-hover-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => dispatch(resumeRun(run.id))}
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(run.id)}
                      className="font-mono text-[11px] text-foreground-faint transition hover:text-destructive-text focus:outline-none"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <Bar value={total ? (answered / total) * 100 : 0} className="mt-2" />

              {note && (
                <div className="mt-2 rounded-md border border-brand-border bg-brand-surface px-2.5 py-1.5 font-mono text-[11px] text-brand-on-surface-muted">
                  {note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {runs.length === MAX_PAUSED && (
        <p className="mt-3 font-mono text-[11px] text-foreground-faint">
          This is the limit of {MAX_PAUSED} — pausing another drops the oldest one.
        </p>
      )}
    </div>
  );
}
