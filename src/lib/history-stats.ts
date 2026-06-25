import type { Attempt } from "./types";

export interface HistorySummary {
  count: number;
  averageScaled: number;
  bestScaled: number;
  averageElapsedSeconds: number;
  passRate: number; // 0..1
}

export function summarizeHistory(attempts: Attempt[]): HistorySummary {
  if (attempts.length === 0) {
    return { count: 0, averageScaled: 0, bestScaled: 0, averageElapsedSeconds: 0, passRate: 0 };
  }
  const count = attempts.length;
  const totalScaled = attempts.reduce((sum, a) => sum + a.scaled, 0);
  const totalElapsed = attempts.reduce((sum, a) => sum + a.elapsedSeconds, 0);
  const passes = attempts.filter((a) => a.passing).length;
  return {
    count,
    averageScaled: Math.round(totalScaled / count),
    bestScaled: Math.max(...attempts.map((a) => a.scaled)),
    averageElapsedSeconds: Math.round(totalElapsed / count),
    passRate: passes / count,
  };
}
