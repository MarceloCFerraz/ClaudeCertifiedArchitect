import { DOMAINS } from "../data/domains";

export function DomainTag({ d }: { d: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-stone-200 px-1.5 py-0.5 font-mono text-[11px] font-medium text-stone-600">
      D{d} · {DOMAINS[d].weight}%
    </span>
  );
}

export function Bar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-stone-200 ${className}`}>
      <div
        className="h-full rounded-full bg-orange-500 transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
