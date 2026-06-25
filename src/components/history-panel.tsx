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
    <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">Your history</h2>
        <button
          type="button"
          onClick={() => dispatch(historyActions.historyCleared())}
          className="font-mono text-[11px] text-stone-400 transition hover:text-rose-600 focus:outline-none"
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
          <div key={k} className="rounded-lg border border-stone-100 bg-stone-50 p-3">
            <div className="font-mono text-[11px] uppercase tracking-wide text-stone-400">{k}</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {recent.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 border-t border-stone-100 pt-2 text-sm first:border-0 first:pt-0"
          >
            <div className="min-w-0">
              <div className="truncate text-stone-700">{a.label}</div>
              <div className="font-mono text-[11px] text-stone-400">
                {new Date(a.date).toLocaleDateString()} · {a.correct}/{a.total} · ⏱{" "}
                {fmtTime(a.elapsedSeconds)}
              </div>
            </div>
            <div
              className={`shrink-0 font-mono text-sm font-bold tabular-nums ${
                a.passing ? "text-emerald-600" : "text-rose-600"
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
