import { useState } from "react";
import { DOMAINS } from "../data/domains";
import { BANK } from "../data/questions";
import { SCENARIOS } from "../data/scenarios";
import type { ExamConfig } from "../lib/types";
import { useAppDispatch } from "../store/hooks";
import { startExam } from "../store/thunks";
import { Bar, DomainTag } from "./atoms";
import { HistoryPanel } from "./history-panel";

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const [timerEnabled, setTimerEnabled] = useState(false);
  // The full mock is always timed; the toggle adds a 2-min/question timer to other modes.
  const start = (config: ExamConfig) => dispatch(startExam({ ...config, timed: timerEnabled }));

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-widest text-orange-600">
          Anthropic · Certification Prep
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Claude Certified Architect — Foundations
        </h1>
        <p className="mt-3 text-stone-600">
          A practice exam faithful to the official Exam Guide: scenario-based questions, multiple
          choice with one correct answer and three distractors, an explanation after every answer,
          and a live score in the top-right corner.
        </p>

        <HistoryPanel />

        {/* rules of the real exam */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Passing score", "720 / 1000"],
            ["Questions", "60"],
            ["Time", "120 min"],
            ["Scenarios", "4 of 6"],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-stone-200 bg-white p-3">
              <div className="font-mono text-[11px] uppercase tracking-wide text-stone-400">
                {k}
              </div>
              <div className="mt-1 text-sm font-semibold">{v}</div>
            </div>
          ))}
        </div>

        {/* domain weights */}
        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
          <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">
            Domains and weights
          </h2>
          <div className="mt-3 space-y-2.5">
            {[1, 2, 3, 4, 5].map((d) => (
              <div key={d} className="flex items-center gap-3">
                <span className="w-10 shrink-0 font-mono text-sm font-semibold text-orange-600">
                  D{d}
                </span>
                <span className="flex-1 text-sm text-stone-700">{DOMAINS[d].name}</span>
                <span className="w-32 shrink-0">
                  <Bar value={DOMAINS[d].weight * 3.7} />
                </span>
                <span className="w-10 shrink-0 text-right font-mono text-sm font-semibold">
                  {DOMAINS[d].weight}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-500">
            The default mode (“Balanced exam”) draws questions that respect these weights exactly.
          </p>
        </div>

        {/* mode picker */}
        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">
              Choose how to practice
            </h2>
            <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-stone-600">
              <input
                type="checkbox"
                checked={timerEnabled}
                onChange={(e) => setTimerEnabled(e.target.checked)}
                className="h-4 w-4 accent-orange-500"
              />
              <span>
                Timed · 2 min/question
                <span className="ml-1 text-xs text-stone-400">(the full mock is always timed)</span>
              </span>
            </label>
          </div>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => start({ mode: "balanced", length: 24 })}
              className="group flex w-full items-center justify-between rounded-lg bg-stone-900 px-4 py-3.5 text-left text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <span>
                <span className="block font-semibold">Balanced exam · 24 questions</span>
                <span className="block text-sm text-stone-300">
                  Exact distribution by domain weight (recommended)
                </span>
              </span>
              <span className="font-mono text-sm text-orange-300 transition group-hover:translate-x-0.5">
                ▶
              </span>
            </button>

            <button
              type="button"
              onClick={() => start({ mode: "mock" })}
              className="group flex w-full items-center justify-between rounded-lg border-2 border-orange-500 bg-orange-50 px-4 py-3.5 text-left transition hover:bg-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <span>
                <span className="block font-semibold text-orange-900">
                  Full mock exam · 60 questions · 120 min
                </span>
                <span className="block text-sm text-orange-800">
                  Same length as the real exam, timed, with harder questions
                </span>
              </span>
              <span className="font-mono text-sm text-orange-600 transition group-hover:translate-x-0.5">
                ▶
              </span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => start({ mode: "balanced", length: 12 })}
                className="rounded-lg border border-stone-200 px-4 py-3 text-left transition hover:border-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span className="block font-semibold">Quick · 12</span>
                <span className="block text-sm text-stone-500">balanced by weight</span>
              </button>
              <button
                type="button"
                onClick={() => start({ mode: "balanced", length: 40 })}
                className="rounded-lg border border-stone-200 px-4 py-3 text-left transition hover:border-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span className="block font-semibold">Long · 40</span>
                <span className="block text-sm text-stone-500">balanced by weight</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => start({ mode: "scenarios" })}
              className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-4 py-3 text-left transition hover:border-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <span>
                <span className="block font-semibold">Scenario mock · 4 of 6</span>
                <span className="block text-sm text-stone-500">
                  draws 4 scenarios, like the real exam
                </span>
              </span>
              <span className="font-mono text-sm text-stone-400">▶</span>
            </button>

            {/* drills */}
            <details className="rounded-lg border border-stone-200 px-4 py-3">
              <summary className="cursor-pointer select-none font-semibold">
                Drill a specific domain
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => start({ mode: "domain", domain: d })}
                    className="rounded-md border border-stone-200 px-3 py-2 text-left text-sm transition hover:border-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    <DomainTag d={d} /> <span className="ml-1">{DOMAINS[d].name}</span>
                  </button>
                ))}
              </div>
            </details>

            <details className="rounded-lg border border-stone-200 px-4 py-3">
              <summary className="cursor-pointer select-none font-semibold">
                Drill a specific scenario
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => start({ mode: "scenario", scenario: s })}
                    className="rounded-md border border-stone-200 px-3 py-2 text-left text-sm transition hover:border-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                  >
                    <span className="font-mono text-xs text-stone-400">Scenario {s}</span> ·{" "}
                    {SCENARIOS[s].title}
                  </button>
                ))}
              </div>
            </details>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-stone-400">
          Bank of {BANK.length} original questions in the style of the guide (
          {BANK.filter((q) => q.diff === "hard").length} flagged as hard, used in the mock exam) ·
          The scaled score is an estimate for reference (the official practice-exam target is &gt;
          900).
        </p>
      </div>
    </div>
  );
}
