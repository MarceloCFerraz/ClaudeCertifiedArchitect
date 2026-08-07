import { useMemo } from "react";
import { squareStatus } from "../lib/choice-state";
import { scenarioBlocks } from "../lib/scenario-blocks";
import type { Answers, PreparedQuestion } from "../lib/types";
import { QuestionSquare } from "./atoms";

export default function ScenarioTracker({
  questions,
  answers,
  current,
  onJump,
}: {
  questions: PreparedQuestion[];
  answers: Answers;
  current: number;
  onJump: (index: number) => void;
}) {
  const blocks = useMemo(() => scenarioBlocks(questions), [questions]);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
      {blocks.map((block) => (
        <div key={block.questions[0].index} className="flex flex-wrap items-center gap-1">
          <span className="flex h-7 items-center rounded-md border border-border-strong bg-background px-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-foreground-subtle">
            S{block.s}
          </span>
          {block.questions.map((item, pos) => (
            <QuestionSquare
              key={item.q.id}
              label={String(pos + 1)}
              status={squareStatus(answers[item.q.id])}
              current={item.index === current}
              onClick={() => onJump(item.index)}
              title={`Scenario ${block.s} · Q${pos + 1}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
