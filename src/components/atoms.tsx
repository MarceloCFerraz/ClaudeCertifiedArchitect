import type { ReactNode } from "react";
import { DOMAINS } from "../data/domains";

/** Wrapper for the hand-rolled inline SVGs. The attributes match Lucide's conventions,
    so a path lifted from there renders identically without adding the dependency. */
export function Icon({
  children,
  className = "h-4 w-4",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

export function DomainTag({ d }: { d: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] font-medium text-foreground-muted">
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
      ? "border-success bg-success text-white"
      : status === "incorrect"
        ? "border-destructive bg-destructive text-white"
        : "border-border-strong bg-card text-foreground-subtle hover:border-border-hover";
  const ring = current ? " ring-2 ring-brand-vivid ring-offset-1 ring-offset-background" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid ${tone}${ring}`}
    >
      {label}
    </button>
  );
}

export function Bar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-secondary ${className}`}>
      <div
        className="h-full rounded-full bg-brand-vivid transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
