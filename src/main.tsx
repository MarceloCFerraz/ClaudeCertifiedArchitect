import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import App from "./App";
import { AnswerModeProvider } from "./components/answer-mode-provider";
import { ErrorBoundary } from "./components/error-boundary";
import { GlossaryProvider } from "./components/glossary-provider";
import { ThemeProvider } from "./components/theme-provider";
import "./index.css";
import { persistor, store } from "./store";
import { bootActions } from "./store/boot";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found");

/* Runs once the persisted state is back but before anything renders, so a restored
   run is made coherent (or cleared) without ever being shown half-built. */
function onBeforeLift() {
  for (const action of bootActions(store.getState(), Date.now())) store.dispatch(action);
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        {/* Outside the store provider on purpose: the glossary's open state is ephemeral
            UI, and nothing about it should reach IndexedDB. The answer mode is outside
            for the opposite reason — it outlives every run, so it must not be parked
            with one or cleared alongside one. */}
        <AnswerModeProvider>
          <GlossaryProvider>
            <Provider store={store}>
              <PersistGate loading={null} persistor={persistor} onBeforeLift={onBeforeLift}>
                <App />
              </PersistGate>
            </Provider>
          </GlossaryProvider>
        </AnswerModeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
