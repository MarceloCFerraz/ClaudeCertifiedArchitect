import { useState, useMemo, useEffect } from "react";
import { DOMAINS } from "./data/domains";
import { SCENARIOS } from "./data/scenarios";
import { BANK } from "./data/questions";

/* =========================================================================
   Claude Certified Architect – Foundations (CCA-F) · Practice Exam
   Faithful to the official Exam Guide:
   - 5 domains with weights: D1 27% · D2 18% · D3 20% · D4 20% · D5 15%
   - 6 scenarios (the real exam randomly draws 4 of 6)
   - Multiple choice: 1 correct + 3 distractors, with an explanation
   - Scaled 100–1000, passing score 720; practice-exam target: >900
   ========================================================================= */


/* ---------- helpers ---------- */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LETTERS = ["A", "B", "C", "D"];

function prepareQuestion(q) {
  const shuffled = shuffle(q.choices);
  const choices = shuffled.map((c, i) => ({ ...c, k: LETTERS[i] }));
  const correctKey = choices.find((c) => c.c).k;
  return { ...q, choices, correctKey };
}

/* largest-remainder allocation of `total` across domains by weight */
function allocateByWeight(total) {
  const ids = [1, 2, 3, 4, 5];
  const raw = ids.map((id) => ({ id, exact: (DOMAINS[id].weight / 100) * total }));
  const floored = raw.map((r) => ({ ...r, base: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }));
  let used = floored.reduce((s, r) => s + r.base, 0);
  let left = total - used;
  const order = [...floored].sort((a, b) => b.rem - a.rem);
  const counts = {};
  floored.forEach((r) => (counts[r.id] = r.base));
  for (let i = 0; i < left; i++) counts[order[i % order.length].id] += 1;
  return counts;
}

function sampleN(pool, n) {
  return shuffle(pool).slice(0, Math.min(n, pool.length));
}

/* weighted draw across domains; preferHard pulls hard questions first within each domain */
function pickByWeight(total, preferHard) {
  const counts = allocateByWeight(total);
  const out = [];
  [1, 2, 3, 4, 5].forEach((d) => {
    const pool = BANK.filter((q) => q.d === d);
    const hard = shuffle(pool.filter((q) => q.diff === "hard"));
    const std = shuffle(pool.filter((q) => q.diff !== "hard"));
    const ordered = preferHard ? [...hard, ...std] : [...std, ...hard];
    out.push(...ordered.slice(0, counts[d]));
  });
  return out;
}

const MOCK_LEN = 60; // matches the real exam: 60 questions / 120 minutes

function buildExam(config) {
  let selected = [];
  if (config.mode === "mock") {
    selected = pickByWeight(MOCK_LEN, true);
  } else if (config.mode === "balanced") {
    selected = pickByWeight(config.length, false);
  } else if (config.mode === "scenarios") {
    const scenarios = shuffle([1, 2, 3, 4, 5, 6]).slice(0, 4);
    config._scenarios = scenarios;
    selected = BANK.filter((q) => scenarios.includes(q.s));
  } else if (config.mode === "domain") {
    selected = BANK.filter((q) => q.d === config.domain);
  } else if (config.mode === "scenario") {
    selected = BANK.filter((q) => q.s === config.scenario);
  } else {
    selected = [...BANK];
  }
  // order grouped by scenario for natural scenario framing, scenarios in random order
  const order = shuffle([1, 2, 3, 4, 5, 6]);
  selected.sort((a, b) => {
    const sa = order.indexOf(a.s), sb = order.indexOf(b.s);
    if (sa !== sb) return sa - sb;
    return 0;
  });
  return selected.map(prepareQuestion);
}

/* ---------- result file (download) ---------- */
function pad2(n) {
  return String(n).padStart(2, "0");
}
function stamp(d) {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}
function fmtTime(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(x)}` : `${pad2(m)}:${pad2(x)}`;
}
function fileTypeFor(cfg) {
  if (cfg.mode === "mock") return "mock";
  if (cfg.mode === "balanced") return "balanced";
  if (cfg.mode === "scenarios") return "scenarios";
  if (cfg.mode === "domain") return `domain-d${cfg.domain}`;
  if (cfg.mode === "scenario") return `scenario-${cfg.scenario}`;
  return "exam";
}
function labelFor(cfg) {
  if (cfg.mode === "mock") return "Mock exam (60 questions · timed · hard)";
  if (cfg.mode === "balanced") return `Balanced exam (${cfg.length} questions)`;
  if (cfg.mode === "scenarios") return "Scenario mock (4 of 6)";
  if (cfg.mode === "domain") return `Drill · ${DOMAINS[cfg.domain].name}`;
  if (cfg.mode === "scenario") return `Drill · Scenario ${cfg.scenario}: ${SCENARIOS[cfg.scenario].title}`;
  return "Exam";
}
function reportFileName(session) {
  return `${session.fileType}-${session.count}q-${stamp(session.createdAt)}.txt`;
}
function buildReport(session, questions, answers) {
  const ans = questions.filter((q) => answers[q.id]);
  const right = ans.filter((q) => answers[q.id].correct).length;
  const scaledV = ans.length ? Math.round(100 + (right / ans.length) * 900) : 100;
  const L = [];
  L.push("Claude Certified Architect – Foundations · Result");
  L.push(`Type: ${session.label}`);
  L.push(`Questions in exam: ${session.count}`);
  L.push(`Created at: ${session.createdAt.toLocaleString()}`);
  L.push(`Answered: ${ans.length}/${session.count}`);
  L.push(`Correct: ${right}/${ans.length}  ·  Estimated scaled score: ${scaledV}  ·  Passing: 720`);
  L.push("=".repeat(72));
  ans.forEach((q, i) => {
    const a = answers[q.id];
    const yours = q.choices.find((c) => c.k === a.selected);
    const correctChoice = q.choices.find((c) => c.k === q.correctKey);
    L.push("");
    L.push(
      `Q${i + 1}  [D${q.d} · Scenario ${q.s} · TS ${q.ts}${q.diff === "hard" ? " · hard" : ""}]  ${a.correct ? "✔ correct" : "✘ wrong"}`
    );
    L.push(q.q);
    q.choices.forEach((c) => L.push(`   ${c.k}) ${c.t}`));
    L.push(`Your answer:    ${a.selected}) ${yours.t}`);
    L.push(`Correct answer: ${q.correctKey}) ${correctChoice.t}`);
    L.push(`Explanation: ${q.exp}`);
  });
  return L.join("\n");
}
function downloadText(name, text) {
  try {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    console.error("download failed", e);
  }
}

/* ---------- small UI atoms ---------- */
function DomainTag({ d }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-stone-200 px-1.5 py-0.5 font-mono text-[11px] font-medium text-stone-600">
      D{d} · {DOMAINS[d].weight}%
    </span>
  );
}

function Bar({ value, className = "" }) {
  return (
    <div className={"h-1.5 w-full overflow-hidden rounded-full bg-stone-200 " + className}>
      <div className="h-full rounded-full bg-orange-500 transition-all duration-300" style={{ width: `${value}%` }} />
    </div>
  );
}

/* ============================ App ============================ */
export default function App() {
  const [screen, setScreen] = useState("home");
  const [config, setConfig] = useState({ mode: "balanced", length: 24 });
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { selected: string; correct: boolean }>
  >({}); // qid -> { selected, correct }
  const [session, setSession] = useState(null); // { label, fileType, count, createdAt, timed }
  const [remaining, setRemaining] = useState(0); // seconds left (mock)

  const answered = Object.keys(answers).length;
  const correct = Object.values(answers).filter((a) => a.correct).length;
  const total = questions.length;
  const pct = answered ? Math.round((correct / answered) * 100) : 0;
  const scaled = answered ? Math.round(100 + (correct / answered) * 900) : 100;
  const passing = scaled >= 720;

  function start(cfg) {
    const built = buildExam({ ...cfg });
    const sess = {
      label: labelFor(cfg),
      fileType: fileTypeFor(cfg),
      count: built.length,
      createdAt: new Date(),
      timed: cfg.mode === "mock",
    };
    setConfig(cfg);
    setQuestions(built);
    setAnswers({});
    setIdx(0);
    setSession(sess);
    if (sess.timed) setRemaining(120 * 60);
    setScreen("exam");
  }

  function saveReport() {
    if (!session) return;
    downloadText(reportFileName(session), buildReport(session, questions, answers));
  }

  function choose(q, key) {
    if (answers[q.id]) return; // locked
    setAnswers((prev) => ({ ...prev, [q.id]: { selected: key, correct: key === q.correctKey } }));
  }

  function next() {
    if (idx + 1 < total) setIdx(idx + 1);
    else setScreen("results");
  }

  /* keyboard: Enter/→ to advance only (no letter shortcuts — they clashed with Cmd/Ctrl+C) */
  useEffect(() => {
    function onKey(e) {
      if (screen !== "exam") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return; // never hijack copy/paste etc.
      const q = questions[idx];
      if (!q) return;
      if ((e.key === "Enter" || e.key === "ArrowRight") && answers[q.id]) next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, idx, questions, answers]);

  /* mock countdown: 120 min, auto-submits at 0 */
  useEffect(() => {
    if (screen !== "exam" || !session?.timed) return;
    if (remaining <= 0) {
      setScreen("results");
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [screen, session, remaining]);

  /* ----------------------- HOME ----------------------- */
  if (screen === "home") {
    return (
      <div className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-orange-600">Anthropic · Certification Prep</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Claude Certified Architect — Foundations
          </h1>
          <p className="mt-3 text-stone-600">
            A practice exam faithful to the official Exam Guide: scenario-based questions, multiple choice with one
            correct answer and three distractors, an explanation after every answer, and a live score in the top-right corner.
          </p>

          {/* rules of the real exam */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Passing score", "720 / 1000"],
              ["Questions", "60"],
              ["Time", "120 min"],
              ["Scenarios", "4 of 6"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-stone-200 bg-white p-3">
                <div className="font-mono text-[11px] uppercase tracking-wide text-stone-400">{k}</div>
                <div className="mt-1 text-sm font-semibold">{v}</div>
              </div>
            ))}
          </div>

          {/* domain weights */}
          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">Domains and weights</h2>
            <div className="mt-3 space-y-2.5">
              {[1, 2, 3, 4, 5].map((d) => (
                <div key={d} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 font-mono text-sm font-semibold text-orange-600">D{d}</span>
                  <span className="flex-1 text-sm text-stone-700">{DOMAINS[d].name}</span>
                  <span className="w-32 shrink-0">
                    <Bar value={DOMAINS[d].weight * 3.7} />
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono text-sm font-semibold">{DOMAINS[d].weight}%</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-stone-500">
              The default mode (“Balanced exam”) draws questions that respect these weights exactly.
            </p>
          </div>

          {/* mode picker */}
          <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">Choose how to practice</h2>

            <div className="mt-4 space-y-3">
              <button
                onClick={() => start({ mode: "balanced", length: 24 })}
                className="group flex w-full items-center justify-between rounded-lg bg-stone-900 px-4 py-3.5 text-left text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span>
                  <span className="block font-semibold">Balanced exam · 24 questions</span>
                  <span className="block text-sm text-stone-300">Exact distribution by domain weight (recommended)</span>
                </span>
                <span className="font-mono text-sm text-orange-300 group-hover:translate-x-0.5 transition">▶</span>
              </button>

              <button
                onClick={() => start({ mode: "mock" })}
                className="group flex w-full items-center justify-between rounded-lg border-2 border-orange-500 bg-orange-50 px-4 py-3.5 text-left transition hover:bg-orange-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span>
                  <span className="block font-semibold text-orange-900">Full mock exam · 60 questions · 120 min</span>
                  <span className="block text-sm text-orange-800">Same length as the real exam, timed, with harder questions</span>
                </span>
                <span className="font-mono text-sm text-orange-600 group-hover:translate-x-0.5 transition">▶</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => start({ mode: "balanced", length: 12 })}
                  className="rounded-lg border border-stone-200 px-4 py-3 text-left transition hover:border-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <span className="block font-semibold">Quick · 12</span>
                  <span className="block text-sm text-stone-500">balanced by weight</span>
                </button>
                <button
                  onClick={() => start({ mode: "balanced", length: 40 })}
                  className="rounded-lg border border-stone-200 px-4 py-3 text-left transition hover:border-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <span className="block font-semibold">Long · 40</span>
                  <span className="block text-sm text-stone-500">balanced by weight</span>
                </button>
              </div>

              <button
                onClick={() => start({ mode: "scenarios" })}
                className="flex w-full items-center justify-between rounded-lg border border-stone-200 px-4 py-3 text-left transition hover:border-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              >
                <span>
                  <span className="block font-semibold">Scenario mock · 4 of 6</span>
                  <span className="block text-sm text-stone-500">draws 4 scenarios, like the real exam</span>
                </span>
                <span className="font-mono text-sm text-stone-400">▶</span>
              </button>

              {/* drills */}
              <details className="rounded-lg border border-stone-200 px-4 py-3">
                <summary className="cursor-pointer select-none font-semibold">Drill a specific domain</summary>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <button
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
                <summary className="cursor-pointer select-none font-semibold">Drill a specific scenario</summary>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((s) => (
                    <button
                      key={s}
                      onClick={() => start({ mode: "scenario", scenario: s })}
                      className="rounded-md border border-stone-200 px-3 py-2 text-left text-sm transition hover:border-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                    >
                      <span className="font-mono text-xs text-stone-400">Scenario {s}</span> · {SCENARIOS[s].title}
                    </button>
                  ))}
                </div>
              </details>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-stone-400">
            Bank of {BANK.length} original questions in the style of the guide ({BANK.filter((q) => q.diff === "hard").length} flagged
            as hard, used in the mock exam) · The scaled score is an estimate for reference (the official practice-exam target
            is &gt; 900).
          </p>
        </div>
      </div>
    );
  }

  /* ----------------------- RESULTS ----------------------- */
  if (screen === "results") {
    const byDomain = {};
    questions.forEach((q) => {
      const a = answers[q.id];
      if (!byDomain[q.d]) byDomain[q.d] = { c: 0, t: 0 };
      byDomain[q.d].t += 1;
      if (a?.correct) byDomain[q.d].c += 1;
    });
    const missed = questions.filter((q) => answers[q.id] && !answers[q.id].correct);
    const finalScaled = total ? Math.round(100 + (correct / total) * 900) : 100;
    const finalPass = finalScaled >= 720;
    const ready = finalScaled >= 900;
    const band = ready
      ? { label: "Ready", note: "You hit the practice-exam target (> 900). Solid confidence for the real deal.", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" }
      : finalPass
      ? { label: "Passing, but shore it up", note: "Above the 720 cut, but below the 900 target. Reinforce the weak domains below.", cls: "text-orange-700 bg-orange-50 border-orange-200" }
      : { label: "Not yet", note: "Below the 720 cut. Review the weak domains and retake.", cls: "text-rose-700 bg-rose-50 border-rose-200" };

    return (
      <div className="min-h-screen bg-stone-100 px-4 py-10 text-stone-900">
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-stone-400">Exam result</p>

          <div className={"mt-3 rounded-2xl border p-6 " + band.cls}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest opacity-70">Estimated score</div>
                <div className="mt-1 text-5xl font-bold tabular-nums">{finalScaled}</div>
                <div className="mt-1 font-mono text-sm opacity-70">
                  {correct}/{total} correct · {Math.round((correct / total) * 100)}% · cut 720
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
            <h2 className="font-mono text-xs uppercase tracking-widest text-stone-400">Performance by domain</h2>
            <div className="mt-3 space-y-3">
              {Object.keys(byDomain)
                .map(Number)
                .sort((a, b) => a - b)
                .map((d) => {
                  const { c, t } = byDomain[d];
                  const p = Math.round((c / t) * 100);
                  const weak = p < 70;
                  return (
                    <div key={d} className="flex items-center gap-3">
                      <span className="w-10 shrink-0 font-mono text-sm font-semibold text-orange-600">D{d}</span>
                      <span className="flex-1 text-sm text-stone-700">{DOMAINS[d].name}</span>
                      <span className="w-28 shrink-0">
                        <Bar value={p} />
                      </span>
                      <span className={"w-20 shrink-0 text-right font-mono text-sm font-semibold " + (weak ? "text-rose-600" : "text-stone-700")}>
                        {c}/{t} · {p}%
                      </span>
                    </div>
                  );
                })}
            </div>
            <p className="mt-3 text-xs text-stone-500">Domains below 70% are flagged in red — prioritize them in your review.</p>
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
                    <div key={q.id} className="border-t border-stone-100 pt-4 first:border-0 first:pt-0">
                      <div className="mb-1 flex items-center gap-2">
                        <DomainTag d={q.d} />
                        <span className="font-mono text-[11px] text-stone-400">
                          Scenario {q.s} · TS {q.ts}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-stone-800">{q.q}</p>
                      <p className="mt-2 text-sm text-rose-700">
                        <span className="font-mono">{a.selected}.</span> {yours.t}
                      </p>
                      <p className="mt-1 text-sm text-emerald-700">
                        <span className="font-mono">{q.correctKey}.</span> {right.t}
                      </p>
                      <p className="mt-2 rounded-md bg-stone-50 p-3 text-sm text-stone-600">{q.exp}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={saveReport}
              className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              ↓ Download results (.txt)
            </button>
            <button
              onClick={() => start(config)}
              className="rounded-lg bg-stone-900 px-5 py-3 font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              Retake this mode
            </button>
            <button
              onClick={() => setScreen("home")}
              className="rounded-lg border border-stone-300 px-5 py-3 font-semibold transition hover:border-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              Back to start
            </button>
          </div>
          {session && (
            <p className="mt-3 text-xs text-stone-400">
              File: <span className="font-mono text-stone-500">{reportFileName(session)}</span> — the name carries the
              test type, the number of questions, and the time the exam was started. It contains every answered question,
              your answer, and the correct one.
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ----------------------- EXAM ----------------------- */
  const q = questions[idx];
  const a = answers[q.id];
  const isAnswered = !!a;
  const scenarioChanged = idx === 0 || questions[idx - 1].s !== q.s;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {/* ---- HUD (top, score on the right) ---- */}
      <div className="sticky top-0 z-10 border-b border-stone-800 bg-stone-900 text-stone-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setScreen("home")}
              className="shrink-0 font-mono text-xs text-stone-400 hover:text-stone-200 focus:outline-none"
              title="Exit"
            >
              ✕
            </button>
            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-widest text-stone-500">
                CCA-F · {session?.timed ? "Mock exam" : "Practice"}
              </div>
              <div className="flex items-center gap-2">
                <span className="truncate font-mono text-xs text-stone-300">
                  Question {idx + 1}/{total}
                </span>
                {session?.timed && (
                  <span
                    className={
                      "shrink-0 font-mono text-xs tabular-nums " +
                      (remaining <= 300 ? "text-orange-300" : "text-stone-400")
                    }
                  >
                    · ⏱ {fmtTime(remaining)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={saveReport}
              title="Download (.txt) with the questions answered so far"
              className="shrink-0 rounded border border-stone-700 px-2 py-1 font-mono text-[11px] text-stone-300 transition hover:border-stone-500 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
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
              <div className={"text-sm font-bold tabular-nums " + (answered ? (passing ? "text-emerald-400" : "text-orange-300") : "text-stone-400")}>
                {answered ? scaled : "—"}
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] uppercase tracking-widest text-stone-500">goal</div>
              <div className="text-sm font-semibold tabular-nums text-stone-400">720</div>
            </div>
          </div>
        </div>
        <Bar value={total ? (idx / total) * 100 : 0} className="rounded-none" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* scenario framing */}
        {scenarioChanged && (
          <div className="mb-5 rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-widest text-orange-600">
                Scenario {q.s}
              </span>
              <span className="font-semibold">{SCENARIOS[q.s].title}</span>
            </div>
            <p className="mt-2 text-sm text-stone-600">{SCENARIOS[q.s].blurb}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SCENARIOS[q.s].domains.map((d) => (
                <DomainTag key={d} d={d} />
              ))}
            </div>
          </div>
        )}

        {/* question */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <DomainTag d={q.d} />
            <span className="font-mono text-[11px] text-stone-400">TS {q.ts}</span>
          </div>
          <p className="text-[15px] font-medium leading-relaxed text-stone-900">{q.q}</p>

          <div className="mt-4 space-y-2.5">
            {q.choices.map((c) => {
              const chosen = a?.selected === c.k;
              const isCorrect = c.k === q.correctKey;
              let cls = "border-stone-200 bg-white hover:border-stone-400";
              let badge = "border-stone-300 text-stone-500";
              if (isAnswered) {
                if (isCorrect) {
                  cls = "border-emerald-300 bg-emerald-50";
                  badge = "border-emerald-500 bg-emerald-500 text-white";
                } else if (chosen) {
                  cls = "border-rose-300 bg-rose-50";
                  badge = "border-rose-500 bg-rose-500 text-white";
                } else {
                  cls = "border-stone-200 bg-white opacity-70";
                }
              }
              return (
                <button
                  key={c.k}
                  disabled={isAnswered}
                  onClick={() => choose(q, c.k)}
                  className={
                    "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 " +
                    cls +
                    (isAnswered ? " cursor-default" : "")
                  }
                >
                  <span className={"mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border font-mono text-xs font-bold " + badge}>
                    {isAnswered && isCorrect ? "✓" : isAnswered && chosen ? "✕" : c.k}
                  </span>
                  <span className="text-sm leading-relaxed text-stone-800">{c.t}</span>
                </button>
              );
            })}
          </div>

          {/* explanation */}
          {isAnswered && (
            <div className="mt-4 rounded-lg border-l-4 border-stone-900 bg-stone-50 p-4">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-widest text-stone-500">
                {a.correct ? "Correct" : `Correct answer: ${q.correctKey}`}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-700">{q.exp}</p>
            </div>
          )}
        </div>

        {/* nav */}
        <div className="mt-5 flex items-center justify-between">
          <span className="font-mono text-xs text-stone-400">
            {isAnswered ? "Shortcut: Enter to advance" : "Select an answer"}
          </span>
          <button
            onClick={next}
            disabled={!isAnswered}
            className={
              "rounded-lg px-6 py-3 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 " +
              (isAnswered
                ? "bg-stone-900 text-white hover:bg-stone-800"
                : "cursor-not-allowed bg-stone-200 text-stone-400")
            }
          >
            {idx + 1 < total ? "Next" : "See result"}
          </button>
        </div>
      </div>
    </div>
  );
}
