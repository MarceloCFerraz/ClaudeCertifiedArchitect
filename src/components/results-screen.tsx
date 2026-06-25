import { DOMAINS } from "../data/domains";
import { PASS_SCORE, READY_SCORE, scoreExam } from "../lib/scoring";
import { reportFileName } from "../lib/report";
import { useSaveReport } from "../hooks/use-save-report";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { examActions } from "../store/exam-slice";
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
        cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
      }
    : passing
      ? {
          label: "Passing, but shore it up",
          note: "Above the 720 cut, but below the 900 target. Reinforce the weak domains below.",
          cls: "text-orange-700 bg-orange-50 border-orange-200",
        }
      : {
          label: "Not yet",
          note: "Below the 720 cut. Review the weak domains and retake.",
          cls: "text-rose-700 bg-rose-50 border-rose-200",
        };

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-stone-400">Exam result</p>

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
        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">
            Performance by domain
          </h2>
          <div className="mt-3 space-y-3">
            {score.perDomain.map(({ domain, correct: c, total: t }) => {
              const p = Math.round((c / t) * 100);
              const weak = p < WEAK_THRESHOLD;
              return (
                <div key={domain} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 font-mono text-sm font-semibold text-orange-600">
                    D{domain}
                  </span>
                  <span className="flex-1 text-sm text-stone-700">{DOMAINS[domain].name}</span>
                  <span className="w-28 shrink-0">
                    <Bar value={p} />
                  </span>
                  <span
                    className={`w-20 shrink-0 text-right font-mono text-sm font-semibold ${
                      weak ? "text-rose-600" : "text-stone-700"
                    }`}
                  >
                    {c}/{t} · {p}%
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-stone-500">
            Domains below 70% are flagged in red — prioritize them in your review.
          </p>
        </div>

        {/* missed review */}
        {missed.length > 0 && (
          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">
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
                    className="border-t border-stone-100 pt-4 first:border-0 first:pt-0"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <DomainTag d={q.d} />
                      <span className="font-mono text-[11px] text-stone-400">
                        Scenario {q.s} · TS {q.ts}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-stone-800">{q.q}</p>
                    <p className="mt-2 text-sm text-rose-700">
                      <span className="font-mono">{a.selected}.</span> {yours?.t}
                    </p>
                    <p className="mt-1 text-sm text-emerald-700">
                      <span className="font-mono">{q.correctKey}.</span> {right?.t}
                    </p>
                    <p className="mt-2 rounded-md bg-stone-50 p-3 text-sm text-stone-600">
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
            className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            ↓ Download results (.txt)
          </button>
          <button
            type="button"
            onClick={() => config && dispatch(startExam(config))}
            className="rounded-lg bg-stone-900 px-5 py-3 font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            Retake this mode
          </button>
          <button
            type="button"
            onClick={() => dispatch(examActions.exitedToHome())}
            className="rounded-lg border border-stone-300 px-5 py-3 font-semibold transition hover:border-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            Back to start
          </button>
        </div>
        {session && (
          <p className="mt-3 text-xs text-stone-400">
            File: <span className="font-mono text-stone-500">{reportFileName(session)}</span> — the
            name carries the test type, the number of questions, and the time the exam was started.
            It contains every answered question, your answer, and the correct one.
          </p>
        )}
      </div>
    </div>
  );
}
