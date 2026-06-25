import { downloadText } from "../lib/download";
import { buildReport, reportFileName } from "../lib/report";
import { useAppSelector } from "../store/hooks";

/** Returns a callback that downloads the current run as a .txt report. */
export function useSaveReport(): () => void {
  const session = useAppSelector((s) => s.exam.session);
  const questions = useAppSelector((s) => s.exam.questions);
  const answers = useAppSelector((s) => s.exam.answers);
  return () => {
    if (!session) return;
    downloadText(reportFileName(session), buildReport(session, questions, answers));
  };
}
