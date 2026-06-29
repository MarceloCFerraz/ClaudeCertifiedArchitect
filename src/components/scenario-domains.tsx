import { useState } from "react";
import { DOMAINS } from "../data/domains";
import { SCENARIOS } from "../data/scenarios";
import { DomainTag } from "./atoms";

export default function ScenarioDomains({ s }: { s: number }) {
  const [open, setOpen] = useState(false);
  const domains = SCENARIOS[s].domains;

  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-1.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      >
        {domains.map((d) => (
          <DomainTag key={d} d={d} />
        ))}
        <span className="font-mono text-[11px] text-stone-400">
          {open ? "▾ hide domains" : "▸ what do these mean?"}
        </span>
      </button>
      {open && (
        <dl className="mt-2 space-y-2 rounded-lg border border-stone-200 bg-white p-3">
          {domains.map((d) => (
            <div key={d}>
              <dt className="text-sm font-semibold text-stone-800">
                D{d} · {DOMAINS[d].name} · {DOMAINS[d].weight}%
              </dt>
              <dd className="mt-0.5 text-sm leading-relaxed text-stone-600">
                {DOMAINS[d].description}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
