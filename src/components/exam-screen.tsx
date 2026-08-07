import { useEffect, useMemo } from "react";
import { useSaveReport } from "../hooks/use-save-report";
import { fmtTime } from "../lib/format";
import { scoreExam } from "../lib/scoring";
import { examActions } from "../store/exam-slice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { finishExam } from "../store/thunks";
import { Bar, DomainTag } from "./atoms";
import ScenarioCard from "./scenario-card";
import ScenarioDomains from "./scenario-domains";
import ScenarioTracker from "./scenario-tracker";

export default function ExamScreen() {
  const dispatch = useAppDispatch();
  const questions = useAppSelector((s) => s.exam.questions);
  const idx = useAppSelector((s) => s.exam.idx);
  const answers = useAppSelector((s) => s.exam.answers);
  const session = useAppSelector((s) => s.exam.session);
  const timed = useAppSelector((s) => s.exam.timed);
  const isMock = useAppSelector((s) => s.exam.config?.mode === "mock");
  const remaining = useAppSelector((s) => s.exam.remaining);
  const saveReport = useSaveReport();

  const total = questions.length;
  const liveScore = useMemo(() => scoreExam(questions, answers, "answered"), [questions, answers]);
  const { answered, correct, scaled, passing } = liveScore;
  const pct = answered ? Math.round((correct / answered) * 100) : 0;

  const q = questions[idx];
  const isLast = idx + 1 >= total;
  const goPrev = () => dispatch(examActions.navigatedTo(idx - 1));
  const onNext = isLast
    ? () => dispatch(finishExam())
    : () => dispatch(examActions.navigatedTo(idx + 1));

  /* keyboard: ←/→ navigate freely; Enter advances (no letter keys — they clashed with
     Cmd/Ctrl+C). Advancing never auto-submits — finishing is an explicit click. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft") {
        if (idx > 0) dispatch(examActions.navigatedTo(idx - 1));
      } else if ((e.key === "Enter" || e.key === "ArrowRight") && !isLast) {
        dispatch(examActions.navigatedTo(idx + 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, isLast, dispatch]);

  /* timed mock countdown: ticks each second, auto-submits at 0 */
  useEffect(() => {
    if (!timed) return;
    if (remaining <= 0) {
      dispatch(finishExam());
      return;
    }
    const t = setTimeout(() => dispatch(examActions.decrementTimer()), 1000);
    return () => clearTimeout(t);
  }, [timed, remaining, dispatch]);

  if (!q) return null;
  const a = answers[q.id];
  const isAnswered = !!a;
  const allAnswered = answered === total;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---- HUD (top, score on the right) ----
           Dark chrome in both themes, so its text keeps fixed stone values — only the
           surface is tokenized, to stay distinguishable from an already-dark page. */}
      <div className="sticky top-0 z-10 border-b border-hud-line bg-hud text-stone-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => dispatch(examActions.exitedToHome())}
              className="shrink-0 font-mono text-xs text-stone-400 hover:text-stone-200 focus:outline-none"
              title="Exit"
              aria-label="Exit exam"
            >
              ✕
            </button>
            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-widest text-stone-500">
                CCA-F · {isMock ? "Mock exam" : "Practice"}
              </div>
              <div className="flex items-center gap-2">
                <span className="truncate font-mono text-xs text-stone-300">
                  Question {idx + 1}/{total}
                </span>
                {session?.timed && (
                  <span
                    className={`shrink-0 font-mono text-xs tabular-nums ${
                      remaining <= 300 ? "text-orange-300" : "text-stone-400"
                    }`}
                  >
                    · ⏱ {fmtTime(remaining)}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={saveReport}
              title="Download (.txt) with the questions answered so far"
              className="shrink-0 rounded border border-stone-700 px-2 py-1 font-mono text-[11px] text-stone-300 transition hover:border-stone-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
            >
              ↓ Save
            </button>
          </div>

          {/* score cluster — top-right */}
          <div className="flex shrink-0 items-center gap-4 text-right font-mono">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-stone-500">correct</div>
              <div className="text-sm font-semibold tabular-nums">
                {correct}/{answered}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-stone-500">% </div>
              <div className="text-sm font-semibold tabular-nums">{pct}%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-stone-500">scaled</div>
              <div
                className={`text-sm font-bold tabular-nums ${
                  answered ? (passing ? "text-emerald-400" : "text-orange-300") : "text-stone-400"
                }`}
              >
                {answered ? scaled : "—"}
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase tracking-widest text-stone-500">goal</div>
              <div className="text-sm font-semibold tabular-nums text-stone-400">720</div>
            </div>
          </div>
        </div>
        <Bar value={total ? (answered / total) * 100 : 0} className="rounded-none" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* per-question progress tracker */}
        <ScenarioTracker
          questions={questions}
          answers={answers}
          current={idx}
          onJump={(i) => dispatch(examActions.navigatedTo(i))}
        />

        {/* scenario framing (collapsible, shown on every question) */}
        <ScenarioCard s={q.s} />
        <ScenarioDomains s={q.s} />

        {/* question */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <DomainTag d={q.d} />
            <span className="font-mono text-[11px] text-foreground-faint">TS {q.ts}</span>
          </div>
          <p className="text-[15px] font-medium leading-relaxed text-foreground">{q.q}</p>

          <div className="mt-4 space-y-2.5">
            {q.choices.map((c) => {
              const chosen = a?.selected === c.k;
              const isCorrect = c.k === q.correctKey;
              let cls = "border-border bg-card hover:border-border-hover";
              let badge = "border-border-strong text-foreground-subtle";
              if (isAnswered) {
                if (isCorrect) {
                  cls = "border-success-border bg-success-surface";
                  badge = "border-success bg-success text-white";
                } else if (chosen) {
                  cls = "border-destructive-border bg-destructive-surface";
                  badge = "border-destructive bg-destructive text-white";
                } else {
                  cls = "border-border bg-card opacity-70";
                }
              }
              return (
                <button
                  type="button"
                  key={c.k}
                  disabled={isAnswered}
                  onClick={() =>
                    dispatch(
                      examActions.answered({
                        qid: q.id,
                        selected: c.k,
                        correct: c.k === q.correctKey,
                      }),
                    )
                  }
                  className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid ${cls}${
                    isAnswered ? " cursor-default" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-bold ${badge}`}
                  >
                    {isAnswered && isCorrect ? "✓" : isAnswered && chosen ? "✕" : c.k}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground">{c.t}</span>
                </button>
              );
            })}
          </div>

          {/* explanation — carries the same green/red tone as the choice it belongs to */}
          {isAnswered && (
            <div
              className={`mt-4 rounded-lg border-l-4 p-4 ${
                a.correct
                  ? "border-success bg-success-surface"
                  : "border-destructive bg-destructive-surface"
              }`}
            >
              <div
                className={`font-mono text-[11px] font-semibold uppercase tracking-widest ${
                  a.correct ? "text-success-text" : "text-destructive-text"
                }`}
              >
                {a.correct ? "Correct" : `Correct answer: ${q.correctKey}`}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">{q.exp}</p>
            </div>
          )}
        </div>

        {/* nav: free movement; finishing is always an explicit click */}
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={idx === 0}
            className={`rounded-lg border px-5 py-3 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid ${
              idx === 0
                ? "cursor-not-allowed border-border text-foreground-disabled"
                : "border-border-strong text-foreground-muted hover:border-border-hover-strong"
            }`}
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            {!isLast && (
              <button
                type="button"
                onClick={() => dispatch(finishExam())}
                disabled={!allAnswered}
                title={
                  allAnswered ? "Finish and see your results" : "Answer all questions to finish"
                }
                className={`rounded-lg border px-5 py-3 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid ${
                  allAnswered
                    ? "border-success-strong bg-success-strong text-white hover:bg-success-strong-hover"
                    : "cursor-not-allowed border-border text-foreground-disabled"
                }`}
              >
                See Results
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
            >
              {isLast ? "See result" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
