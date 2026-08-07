/* Padding stays on each button rather than in here: two Tailwind padding classes on
   one element resolve by stylesheet order, not by the order they are written. */
const BASE =
  "rounded-lg py-3 font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid";
const DISABLED = "cursor-not-allowed border border-border text-foreground-disabled";

export default function ExamNav({
  isFirst,
  isLast,
  allAnswered,
  finishTitle,
  onPrev,
  onNext,
  onFinish,
}: {
  isFirst: boolean;
  isLast: boolean;
  allAnswered: boolean;
  finishTitle: string;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  return (
    <div className="mt-5 flex items-center justify-between">
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirst}
        className={`${BASE} border px-5 ${
          isFirst
            ? DISABLED
            : "border-border-strong text-foreground-muted hover:border-border-hover-strong"
        }`}
      >
        ← Previous
      </button>

      <div className="flex items-center gap-2">
        {!isLast && (
          <button
            type="button"
            onClick={onFinish}
            disabled={!allAnswered}
            title={finishTitle}
            className={`${BASE} border px-5 ${
              allAnswered
                ? "border-success-strong bg-success-strong text-white hover:bg-success-strong-hover"
                : DISABLED
            }`}
          >
            See Results
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={isLast && !allAnswered}
          title={isLast ? finishTitle : undefined}
          className={`${BASE} px-6 ${
            isLast && !allAnswered
              ? DISABLED
              : "bg-primary text-primary-foreground hover:bg-primary-hover"
          }`}
        >
          {isLast ? "See result" : "Next →"}
        </button>
      </div>
    </div>
  );
}
