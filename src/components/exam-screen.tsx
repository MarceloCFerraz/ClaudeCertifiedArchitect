import { useEffect, useMemo, useState } from "react";
import { useSaveReport } from "../hooks/use-save-report";
import { remainingAt } from "../lib/exam-clock";
import { fmtTime } from "../lib/format";
import { scoreExam } from "../lib/scoring";
import { examActions } from "../store/exam-slice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { chooseChoice, finishExam, pauseExam, submitAnswer } from "../store/thunks";
import { useAnswerMode } from "./answer-mode-provider";
import AnswerModeToggle from "./answer-mode-toggle";
import { Bar, DomainTag } from "./atoms";
import ChoiceList from "./choice-list";
import ExamNav from "./exam-nav";
import { useGlossary } from "./glossary-provider";
import GlossaryText from "./glossary-text";
import LeaveExamMenu from "./leave-exam-menu";
import ScenarioCard from "./scenario-card";
import ScenarioDomains from "./scenario-domains";
import ScenarioTracker from "./scenario-tracker";

/** A question with nothing crossed out carries no entry at all, so this stands in —
    shared rather than a fresh `[]` per render, which would change identity each time. */
const EMPTY_ELIMINATIONS: readonly string[] = [];

export default function ExamScreen() {
  const dispatch = useAppDispatch();
  const questions = useAppSelector((s) => s.exam.questions);
  const idx = useAppSelector((s) => s.exam.idx);
  const answers = useAppSelector((s) => s.exam.answers);
  const selections = useAppSelector((s) => s.exam.selections);
  const eliminations = useAppSelector((s) => s.exam.eliminations);
  const { mode } = useAnswerMode();
  const session = useAppSelector((s) => s.exam.session);
  const timed = useAppSelector((s) => s.exam.timed);
  const isMock = useAppSelector((s) => s.exam.config?.mode === "mock");
  const elapsedSeconds = useAppSelector((s) => s.exam.elapsedSeconds);
  const remainingSeconds = useAppSelector((s) => s.exam.remainingSeconds);
  const runningSince = useAppSelector((s) => s.exam.runningSince);
  const { open: glossaryOpen, openGlossary } = useGlossary();
  const [leaveOpen, setLeaveOpen] = useState(false);
  // The clock is derived from wall time rather than counted down in the store, so this
  // tick only refreshes the display — it dispatches nothing and persists nothing.
  const [now, setNow] = useState(() => Date.now());
  const remaining = remainingAt({ timed, elapsedSeconds, remainingSeconds, runningSince }, now);
  const saveReport = useSaveReport();

  const total = questions.length;
  const liveScore = useMemo(() => scoreExam(questions, answers, "answered"), [questions, answers]);
  const { answered, correct, scaled, passing } = liveScore;
  const pct = answered ? Math.round((correct / answered) * 100) : 0;

  const q = questions[idx];
  const isLast = idx + 1 >= total;
  const qid = q?.id;
  // Derived before the effects below, which need them; the `if (!q)` bail-out comes
  // after, so both are read defensively here.
  const pending = qid ? selections[qid] : undefined;
  const canSubmitCurrent = !!qid && !!pending && !answers[qid];
  const goPrev = () => dispatch(examActions.navigatedTo(idx - 1));
  const onNext = isLast
    ? () => dispatch(finishExam())
    : () => dispatch(examActions.navigatedTo(idx + 1));

  /* keyboard: ←/→ navigate freely; Enter submits the pick waiting on this question and
     otherwise advances (no letter keys — they clashed with Cmd/Ctrl+C). Moving on never
     auto-submits, so a pick can be left pending deliberately; finishing is always an
     explicit click. Silent while the leave menu or the glossary is open, or Enter would
     both pick a menu item and advance the question behind it, and arrow keys typed into
     the glossary's search box would walk the exam underneath the overlay. */
  useEffect(() => {
    if (leaveOpen || glossaryOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement) {
        // A term in the explanation is a focusable button: Enter there opens its tooltip
        // and must not also advance the question behind it.
        if (e.target.closest("[data-glossary-term]")) return;
        // A focused choice or scissors handles Enter itself, so the focused control
        // wins — but only Enter. Swallowing the arrows as well would strand keyboard
        // navigation on whichever choice was clicked last, since a choice now keeps
        // focus instead of being disabled out from under it.
        if (e.key === "Enter" && e.target.closest("[data-choice]")) return;
      }
      if (e.key === "ArrowLeft") {
        if (idx > 0) dispatch(examActions.navigatedTo(idx - 1));
      } else if (e.key === "Enter" && canSubmitCurrent && qid) {
        dispatch(submitAnswer(qid));
      } else if ((e.key === "Enter" || e.key === "ArrowRight") && !isLast) {
        dispatch(examActions.navigatedTo(idx + 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, isLast, leaveOpen, glossaryOpen, dispatch, qid, canSubmitCurrent]);

  /* timed countdown: re-reads the wall clock each second so a throttled or backgrounded
     tab catches up on wake instead of silently stalling, and submits once it runs out */
  useEffect(() => {
    if (!timed) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [timed]);

  useEffect(() => {
    if (timed && remaining <= 0) dispatch(finishExam());
  }, [timed, remaining, dispatch]);

  if (!q) return null;
  const a = answers[q.id];
  const isAnswered = !!a;
  const allAnswered = answered === total;
  /* Both finish buttons carry the same gate. The last question used to be an escape
     hatch out of a partly-answered run, which was already inconsistent with the
     mid-exam button — and with a pick that can now sit unsubmitted, an ungated
     "See result" would quietly score it as never answered. */
  const outstanding = total - answered;
  const finishTitle = allAnswered
    ? "Finish and see your results"
    : `${outstanding} question${outstanding === 1 ? "" : "s"} still to submit`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---- HUD (top, score on the right) ----
           Dark chrome in both themes, so its text keeps fixed stone values — only the
           surface is tokenized, to stay distinguishable from an already-dark page. */}
      <div className="sticky top-0 z-10 border-b border-hud-line bg-hud text-stone-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            {/* Always asks, even with nothing answered yet: a run is its draw as much as
                its answers — a mock you just started is a specific timed set worth coming
                back to — and one button that sometimes asks and sometimes discards is
                indistinguishable from a broken one. */}
            <LeaveExamMenu
              open={leaveOpen}
              onOpenChange={setLeaveOpen}
              onPause={() => dispatch(pauseExam())}
              onDiscard={() => dispatch(examActions.examCleared())}
            />
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
            <AnswerModeToggle />
            {/* The one solid fill in the HUD, so it cannot be missed among chrome that
                is otherwise text and thin outlines. White on a saturated brand fill is
                the documented exception to the token rule; the focus ring goes white and
                offset, because an orange ring on an orange button is invisible. */}
            <button
              type="button"
              onClick={openGlossary}
              title="Look up a term without leaving the question"
              className="shrink-0 rounded bg-brand-vivid px-2 py-1 font-mono text-[11px] font-semibold text-white transition hover:bg-brand-bright focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-hud"
            >
              Glossary
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
          selections={selections}
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

          <ChoiceList
            q={q}
            mode={mode}
            answer={a}
            pending={pending}
            eliminated={eliminations[q.id] ?? EMPTY_ELIMINATIONS}
            onChoose={(key) => dispatch(chooseChoice(q.id, key, mode === "instant"))}
            onToggleEliminate={(key) =>
              dispatch(examActions.eliminationToggled({ qid: q.id, key }))
            }
            onSubmit={() => dispatch(submitAnswer(q.id))}
          />

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
              <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
                <GlossaryText text={q.exp} />
              </p>
            </div>
          )}
        </div>

        {/* nav: free movement; finishing is always an explicit click, and never lands
            on a question whose answer was picked but never submitted */}
        <ExamNav
          isFirst={idx === 0}
          isLast={isLast}
          allAnswered={allAnswered}
          finishTitle={finishTitle}
          onPrev={goPrev}
          onNext={onNext}
          onFinish={() => dispatch(finishExam())}
        />
      </div>
    </div>
  );
}
