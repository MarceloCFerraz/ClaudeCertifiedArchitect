import { useState } from "react";
import { SCENARIOS } from "../data/scenarios";
import { ANNOTATE_ALL } from "../lib/glossary-terms";
import GlossaryText from "./glossary-text";

export default function ScenarioCard({ s }: { s: number }) {
  const [open, setOpen] = useState(true);
  const scenario = SCENARIOS[s];

  return (
    <div className="mb-3 rounded-xl border border-border bg-card p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
      >
        <span className="font-mono text-xs text-foreground-faint">{open ? "▽" : "▷"}</span>
        <span className="font-mono text-[11px] uppercase tracking-widest text-brand">
          Scenario {s}
        </span>
        <span className="font-semibold">{scenario.title}</span>
      </button>
      {/* The blurb is identical for every question in the scenario, so underlining it
          carries no per-question signal — unlike the stem, which stays untouched. */}
      {open && (
        <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
          <GlossaryText text={scenario.blurb} max={ANNOTATE_ALL} />
        </p>
      )}
    </div>
  );
}
