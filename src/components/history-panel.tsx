import { fmtTime } from "../lib/format";
import { summarizeHistory } from "../lib/history-stats";
import { historyActions } from "../store/history-slice";
import { useAppDispatch, useAppSelector } from "../store/hooks";

export function HistoryPanel() {
  const dispatch = useAppDispatch();
  const attempts = useAppSelector((s) => s.history.attempts);
  if (attempts.length === 0) return null;

  const summary = summarizeHistory(attempts);
  const recent = attempts.slice(0, 5);

  return (
    <div className="mt-6 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-foreground-faint">
          Your history
        </h2>
        <button
          type="button"
          onClick={() => dispatch(historyActions.historyCleared())}
          className="font-mono text-[11px] text-foreground-faint transition hover:text-destructive-text focus:outline-none"
        >
          Clear
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Attempts", String(summary.count)],
          ["Avg score", String(summary.averageScaled)],
          ["Best", String(summary.bestScaled)],
          ["Avg time", fmtTime(summary.averageElapsedSeconds)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-border-subtle bg-muted p-3">
            <div className="font-mono text-[11px] uppercase tracking-wide text-foreground-faint">
              {k}
            </div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {recent.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 border-t border-border-subtle pt-2 text-sm first:border-0 first:pt-0"
          >
            <div className="min-w-0">
              <div className="truncate text-foreground-muted">{a.label}</div>
              <div className="font-mono text-[11px] text-foreground-faint">
                {new Date(a.date).toLocaleDateString()} · {a.correct}/{a.total} · ⏱{" "}
                {fmtTime(a.elapsedSeconds)}
              </div>
            </div>
            <div
              className={`shrink-0 font-mono text-sm font-bold tabular-nums ${
                a.passing ? "text-success-text" : "text-destructive-text"
              }`}
            >
              {a.scaled}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
