import { DOMAINS } from "../data/domains";
import { useSaveReport } from "../hooks/use-save-report";
import { reportFileName } from "../lib/report";
import { PASS_SCORE, READY_SCORE, scoreExam } from "../lib/scoring";
import { examActions } from "../store/exam-slice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { startExam } from "../store/thunks";
import { Bar, DomainTag } from "./atoms";

const WEAK_THRESHOLD = 70;

export default function ResultsScreen() {
  const dispatch = useAppDispatch();
  const questions = useAppSelector((s) => s.exam.questions);
  const answers = useAppSelector((s) => s.exam.answers);
  const config = useAppSelector((s) => s.exam.config);
  const session = useAppSelector((s) => s.exam.session);
  const saveReport = useSaveReport();

  const score = scoreExam(questions, answers, "total");
  const { scaled, correct, total } = score;
  const missed = questions.filter((q) => answers[q.id] && !answers[q.id].correct);
  const ready = scaled >= READY_SCORE;
  const passing = scaled >= PASS_SCORE;
  const band = ready
    ? {
        label: "Ready",
        note: "You hit the practice-exam target (> 900). Solid confidence for the real deal.",
        cls: "text-success-text bg-success-surface border-success-border-subtle",
      }
    : passing
      ? {
          label: "Passing, but shore it up",
          note: "Above the 720 cut, but below the 900 target. Reinforce the weak domains below.",
          cls: "text-brand-on-surface-muted bg-brand-surface border-brand-border",
        }
      : {
          label: "Not yet",
          note: "Below the 720 cut. Review the weak domains and retake.",
          cls: "text-destructive-text bg-destructive-surface border-destructive-border-subtle",
        };

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-foreground-faint">
          Exam result
        </p>

        <div className={`mt-3 rounded-2xl border p-6 ${band.cls}`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest opacity-70">
                Estimated score
              </div>
              <div className="mt-1 text-5xl font-bold tabular-nums">{scaled}</div>
              <div className="mt-1 font-mono text-sm opacity-70">
                {correct}/{total} correct · {total ? Math.round((correct / total) * 100) : 0}% · cut
                720
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{band.label}</div>
              <div className="mt-1 max-w-xs text-sm opacity-80">{band.note}</div>
            </div>
          </div>
        </div>

        {/* per domain */}
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="font-mono text-xs uppercase tracking-widest text-foreground-faint">
            Performance by domain
          </h2>
          <div className="mt-3 space-y-3">
            {score.perDomain.map(({ domain, correct: c, total: t }) => {
              const p = Math.round((c / t) * 100);
              const weak = p < WEAK_THRESHOLD;
              return (
                <div key={domain} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 font-mono text-sm font-semibold text-brand">
                    D{domain}
                  </span>
                  <span className="flex-1 text-sm text-foreground-muted">
                    {DOMAINS[domain].name}
                  </span>
                  <span className="w-28 shrink-0">
                    <Bar value={p} />
                  </span>
                  <span
                    className={`w-20 shrink-0 text-right font-mono text-sm font-semibold ${
                      weak ? "text-destructive-text" : "text-foreground-muted"
                    }`}
                  >
                    {c}/{t} · {p}%
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-foreground-subtle">
            Domains below 70% are flagged in red — prioritize them in your review.
          </p>
        </div>

        {/* missed review */}
        {missed.length > 0 && (
          <div className="mt-6 rounded-xl border border-border bg-card p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground-faint">
              Review · {missed.length} to review
            </h2>
            <div className="mt-4 space-y-5">
              {missed.map((q) => {
                const a = answers[q.id];
                const yours = q.choices.find((c) => c.k === a.selected);
                const right = q.choices.find((c) => c.k === q.correctKey);
                return (
                  <div
                    key={q.id}
                    className="border-t border-border-subtle pt-4 first:border-0 first:pt-0"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <DomainTag d={q.d} />
                      <span className="font-mono text-[11px] text-foreground-faint">
                        Scenario {q.s} · TS {q.ts}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{q.q}</p>
                    <p className="mt-2 text-sm text-destructive-text">
                      <span className="font-mono">{a.selected}.</span> {yours?.t}
                    </p>
                    <p className="mt-1 text-sm text-success-text">
                      <span className="font-mono">{q.correctKey}.</span> {right?.t}
                    </p>
                    <p className="mt-2 rounded-md bg-muted p-3 text-sm text-foreground-muted">
                      {q.exp}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveReport}
            className="rounded-lg bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-vivid focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
          >
            ↓ Download results (.txt)
          </button>
          <button
            type="button"
            onClick={() => config && dispatch(startExam(config))}
            className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
          >
            Retake this mode
          </button>
          <button
            type="button"
            onClick={() => dispatch(examActions.exitedToHome())}
            className="rounded-lg border border-border-strong px-5 py-3 font-semibold transition hover:border-border-hover-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
          >
            Back to start
          </button>
        </div>
        {session && (
          <p className="mt-3 text-xs text-foreground-faint">
            File:{" "}
            <span className="font-mono text-foreground-subtle">{reportFileName(session)}</span> —
            the name carries the test type, the number of questions, and the time the exam was
            started. It contains every answered question, your answer, and the correct one.
          </p>
        )}
      </div>
    </div>
  );
}
