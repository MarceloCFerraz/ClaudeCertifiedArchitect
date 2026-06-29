import { useState } from "react";
import { SCENARIOS } from "../data/scenarios";

export default function ScenarioCard({ s }: { s: number }) {
  const [open, setOpen] = useState(true);
  const scenario = SCENARIOS[s];

  return (
    <div className="mb-3 rounded-xl border border-stone-200 bg-white p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      >
        <span className="font-mono text-xs text-stone-400">{open ? "▽" : "▷"}</span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-orange-600">
          Scenario {s}
        </span>
        <span className="font-semibold">{scenario.title}</span>
      </button>
      {open && <p className="mt-2 text-sm text-stone-600">{scenario.blurb}</p>}
    </div>
  );
}
