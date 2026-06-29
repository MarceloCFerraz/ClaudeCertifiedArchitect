import { DOMAINS } from "../data/domains";

export function DomainTag({ d }: { d: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-stone-200 px-1.5 py-0.5 font-mono text-[11px] font-medium text-stone-600">
      D{d} · {DOMAINS[d].weight}%
    </span>
  );
}

export type SquareStatus = "unanswered" | "correct" | "incorrect";

export function QuestionSquare({
  label,
  status,
  current,
  onClick,
  title,
}: {
  label: string;
  status: SquareStatus;
  current: boolean;
  onClick: () => void;
  title?: string;
}) {
  const tone =
    status === "correct"
      ? "border-emerald-500 bg-emerald-500 text-white"
      : status === "incorrect"
        ? "border-rose-500 bg-rose-500 text-white"
        : "border-stone-300 bg-white text-stone-500 hover:border-stone-400";
  const ring = current ? " ring-2 ring-orange-500 ring-offset-1" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${tone}${ring}`}
    >
      {label}
    </button>
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
