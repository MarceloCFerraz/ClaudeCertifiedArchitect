import { useEffect } from "react";
import ExamScreen from "./components/exam-screen";
import Footer from "./components/footer";
import HomeScreen from "./components/home-screen";
import ResultsScreen from "./components/results-screen";
import { rebuildExam } from "./lib/session";
import { examActions } from "./store/exam-slice";
import { useAppDispatch, useAppSelector } from "./store/hooks";

export default function App() {
  const dispatch = useAppDispatch();
  const screen = useAppSelector((s) => s.exam.screen);
  const config = useAppSelector((s) => s.exam.config);
  const seed = useAppSelector((s) => s.exam.seed);
  const hasQuestions = useAppSelector((s) => s.exam.questions.length > 0);

  // Resume after reload: redux-persist restores (config, seed) but not the
  // questions, so rebuild the exact same draw deterministically.
  useEffect(() => {
    if (screen !== "home" && config && seed != null && !hasQuestions) {
      dispatch(examActions.questionsRebuilt(rebuildExam(config, seed)));
    }
  }, [screen, config, seed, hasQuestions, dispatch]);

  if (screen !== "home" && !hasQuestions) return null; // briefly, while resuming a persisted run

  const screenEl =
    screen === "home" ? <HomeScreen /> : screen === "results" ? <ResultsScreen /> : <ExamScreen />;

  return (
    <>
      {screenEl}
      <Footer />
    </>
  );
}
