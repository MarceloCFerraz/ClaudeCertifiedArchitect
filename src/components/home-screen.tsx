import { useState } from "react";
import { DOMAINS } from "../data/domains";
import { GLOSSARY } from "../data/glossary";
import { BANK } from "../data/questions";
import { SCENARIOS } from "../data/scenarios";
import type { ExamConfig } from "../lib/types";
import { useAppDispatch } from "../store/hooks";
import { startExam } from "../store/thunks";
import { Bar, DomainTag } from "./atoms";
import { useGlossary } from "./glossary-provider";
import { HistoryPanel } from "./history-panel";
import { PausedPanel } from "./paused-panel";

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const { openGlossary } = useGlossary();
  const [timerEnabled, setTimerEnabled] = useState(false);
  // The full mock is always timed; the toggle adds a 2-min/question timer to other modes.
  const start = (config: ExamConfig) => dispatch(startExam({ ...config, timed: timerEnabled }));

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-brand">
          Anthropic · Certification Prep
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Claude Certified Architect — Foundations
        </h1>
        <p className="mt-3 text-foreground-muted">
          A practice exam faithful to the official Exam Guide: scenario-based questions, multiple
          choice with one correct answer and three distractors, an explanation after every answer,
          and a live score in the top-right corner.
        </p>

        {/* First thing after the intro: the vocabulary is what stops a newcomer before
            any of the practice modes can help them. Kept in the neutral card style so it
            does not compete with the mock exam, which is still the primary action. */}
        <button
          type="button"
          onClick={openGlossary}
          className="group mt-6 flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-5 text-left transition hover:border-border-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
        >
          <span>
            <span className="block font-mono text-xs uppercase tracking-widest text-brand">
              Glossary
            </span>
            <span className="mt-1 block text-sm text-foreground-muted">
              {GLOSSARY.length} terms the exam takes for granted, one sentence each — and underlined
              wherever they come up.
            </span>
          </span>
          <span className="font-mono text-sm text-foreground-faint transition group-hover:translate-x-0.5">
            ▶
          </span>
        </button>

        <PausedPanel />
        <HistoryPanel />

        {/* rules of the real exam */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Passing score", "720 / 1000"],
            ["Questions", "60"],
            ["Time", "120 min"],
            ["Scenarios", "4 of 6"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border bg-card p-3">
              <div className="font-mono text-[11px] uppercase tracking-wide text-foreground-faint">
                {k}
              </div>
              <div className="mt-1 text-sm font-semibold">{v}</div>
            </div>
          ))}
        </div>

        {/* domain weights */}
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <h2 className="font-mono text-xs uppercase tracking-widest text-foreground-faint">
            Domains and weights
          </h2>
          <div className="mt-3 space-y-2.5">
            {[1, 2, 3, 4, 5].map((d) => (
              <div key={d} className="flex items-center gap-3">
                <span className="w-10 shrink-0 font-mono text-sm font-semibold text-domain">
                  D{d}
                </span>
                <span className="flex-1 text-sm text-foreground-muted">{DOMAINS[d].name}</span>
                <span className="w-32 shrink-0">
                  <Bar value={DOMAINS[d].weight * 3.7} />
                </span>
                <span className="w-10 shrink-0 text-right font-mono text-sm font-semibold">
                  {DOMAINS[d].weight}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-foreground-subtle">
            The default mode (“Balanced exam”) draws questions that respect these weights exactly.
          </p>
        </div>

        {/* mode picker */}
        <div className="mt-6 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-xs uppercase tracking-widest text-foreground-faint">
              Choose how to practice
            </h2>
            <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-foreground-muted">
              <input
                type="checkbox"
                checked={timerEnabled}
                onChange={(e) => setTimerEnabled(e.target.checked)}
                className="h-4 w-4 accent-brand-vivid"
              />
              <span>
                Timed · 2 min/question
                <span className="ml-1 text-xs text-foreground-faint">
                  (the full mock is always timed)
                </span>
              </span>
            </label>
          </div>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => start({ mode: "balanced", length: 24 })}
              className="group flex w-full items-center justify-between rounded-lg bg-primary px-4 py-3.5 text-left text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
            >
              <span>
                <span className="block font-semibold">Balanced exam · 24 questions</span>
                <span className="block text-sm text-primary-foreground/70">
                  Exact distribution by domain weight (recommended)
                </span>
              </span>
              <span className="font-mono text-sm text-primary-accent transition group-hover:translate-x-0.5">
                ▶
              </span>
            </button>

            <button
              type="button"
              onClick={() => start({ mode: "mock" })}
              className="group flex w-full items-center justify-between rounded-lg border-2 border-brand-vivid bg-brand-surface px-4 py-3.5 text-left transition hover:bg-brand-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
            >
              <span>
                <span className="block font-semibold text-brand-on-surface">
                  Full mock exam · 60 questions · 120 min
                </span>
                <span className="block text-sm text-brand-on-surface-muted">
                  Same length as the real exam, timed, with harder questions
                </span>
              </span>
              <span className="font-mono text-sm text-brand transition group-hover:translate-x-0.5">
                ▶
              </span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => start({ mode: "balanced", length: 12 })}
                className="rounded-lg border border-border px-4 py-3 text-left transition hover:border-border-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
              >
                <span className="block font-semibold">Quick · 12</span>
                <span className="block text-sm text-foreground-subtle">balanced by weight</span>
              </button>
              <button
                type="button"
                onClick={() => start({ mode: "balanced", length: 40 })}
                className="rounded-lg border border-border px-4 py-3 text-left transition hover:border-border-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
              >
                <span className="block font-semibold">Long · 40</span>
                <span className="block text-sm text-foreground-subtle">balanced by weight</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => start({ mode: "scenarios" })}
              className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left transition hover:border-border-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
            >
              <span>
                <span className="block font-semibold">Scenario mock · 4 of 6</span>
                <span className="block text-sm text-foreground-subtle">
                  draws 4 scenarios, like the real exam
                </span>
              </span>
              <span className="font-mono text-sm text-foreground-faint">▶</span>
            </button>

            {/* drills */}
            <details className="rounded-lg border border-border px-4 py-3">
              <summary className="cursor-pointer select-none font-semibold">
                Drill a specific domain
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => start({ mode: "domain", domain: d })}
                    className="rounded-md border border-border px-3 py-2 text-left text-sm transition hover:border-brand-bright focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
                  >
                    <DomainTag d={d} /> <span className="ml-1">{DOMAINS[d].name}</span>
                  </button>
                ))}
              </div>
            </details>

            <details className="rounded-lg border border-border px-4 py-3">
              <summary className="cursor-pointer select-none font-semibold">
                Drill a specific scenario
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => start({ mode: "scenario", scenario: s })}
                    className="rounded-md border border-border px-3 py-2 text-left text-sm transition hover:border-brand-bright focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
                  >
                    <span className="font-mono text-xs text-foreground-faint">Scenario {s}</span> ·{" "}
                    {SCENARIOS[s].title}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-foreground-faint">
          Bank of {BANK.length} original questions in the style of the guide (
          {BANK.filter((q) => q.diff === "hard").length} flagged as hard, used in the mock exam) ·
          The scaled score is an estimate for reference (the official practice-exam target is &gt;
          900).
        </p>
      </div>
    </div>
  );
}
