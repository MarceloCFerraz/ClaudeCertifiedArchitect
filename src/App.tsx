import ExamScreen from "./components/exam-screen";
import Footer from "./components/footer";
import GlossaryModal from "./components/glossary-modal";
import GlossaryPage from "./components/glossary-page";
import { useGlossary } from "./components/glossary-provider";
import HomeScreen from "./components/home-screen";
import ResultsScreen from "./components/results-screen";
import ThemeToggle from "./components/theme-toggle";
import { useAppSelector } from "./store/hooks";

export default function App() {
  const screen = useAppSelector((s) => s.exam.screen);
  const { open } = useGlossary();

  /* Page or overlay is decided by whether we are on the *home* screen, not by whether an
     exam is running. That is what keeps a timed mock honest: when the clock runs out
     mid-lookup the screen flips exam → results underneath, and both of those want the
     overlay — so an open glossary stays an overlay instead of quietly becoming a full
     page on top of the results. */
  const asPage = open && screen === "home";

  const screenEl = asPage ? (
    <GlossaryPage />
  ) : screen === "home" ? (
    <HomeScreen />
  ) : screen === "results" ? (
    <ResultsScreen />
  ) : (
    <ExamScreen />
  );

  return (
    <>
      {screenEl}
      {open && !asPage && <GlossaryModal />}
      {/* Parked in the gutter beside the max-w-3xl column, below the exam HUD, so it
          never covers content. Narrower viewports have no gutter — Footer carries it.
          The menu aligns left so it opens away from the column, into empty gutter; at
          the lg breakpoint that leaves it ~116px, which is what keeps the menu narrow. */}
      <ThemeToggle
        className="fixed left-[calc(50%+24rem+0.75rem)] top-24 z-20 hidden lg:flex"
        menuAlign="left"
      />
      <Footer />
    </>
  );
}
