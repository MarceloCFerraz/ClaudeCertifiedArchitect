import { useState } from "react";
import { DOMAINS } from "../data/domains";
import { SCENARIOS } from "../data/scenarios";
import { ANNOTATE_ALL } from "../lib/glossary-terms";
import { DomainTag } from "./atoms";
import GlossaryText from "./glossary-text";

export default function ScenarioDomains({ s }: { s: number }) {
  const [open, setOpen] = useState(false);
  const domains = SCENARIOS[s].domains;

  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
      >
        {domains.map((d) => (
          <DomainTag key={d} d={d} />
        ))}
        <span className="font-mono text-[11px] text-foreground-faint">
          {open ? "▾ hide domains" : "▸ what do these mean?"}
        </span>
      </button>
      {open && (
        <dl className="mt-2 space-y-2 rounded-lg border border-border bg-card p-3">
          {domains.map((d) => (
            <div key={d}>
              {/* Same heading treatment as ScenarioCard — mono label, name in the body
                  face, weight back in mono so it reads as a value — but in the domain
                  blue, since a scenario heading in brand orange sits just above it. */}
              <dt className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-[11px] uppercase tracking-widest text-domain">
                  Domain {d}
                </span>
                <span className="text-sm font-semibold text-foreground">{DOMAINS[d].name}</span>
                <span className="font-mono text-[11px] text-domain">{DOMAINS[d].weight}%</span>
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-foreground-muted">
                <GlossaryText text={DOMAINS[d].description} max={ANNOTATE_ALL} />
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
