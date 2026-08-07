import { Component, type ErrorInfo, type ReactNode } from "react";
import { persistor } from "../store";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** The one place a class is required: React error boundaries are class-only.
    Catches render errors (e.g. a malformed question) so the app shows a recovery
    screen instead of a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled UI error:", error, info);
  }

  private readonly reset = async (): Promise<void> => {
    // Clear any persisted run that might be triggering the error, then reload.
    await persistor.purge();
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="max-w-md rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-lg font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            The app hit an unexpected error. Reload to try again, or reset to clear any saved exam
            state.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={this.reset}
              className="rounded-lg border border-border-strong px-4 py-2.5 font-semibold transition hover:border-border-hover-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
            >
              Reset & restart
            </button>
          </div>
        </div>
      </div>
    );
  }
}
