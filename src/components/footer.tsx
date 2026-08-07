import ThemeToggle from "./theme-toggle";

const REPO_URL = "https://github.com/MarceloCFerraz/ClaudeCertifiedArchitect";

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-background px-4 pb-8 pt-2 text-foreground">
      <div className="mx-auto flex w-fit items-center gap-3">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-md px-2 py-1 text-sm text-foreground-subtle transition hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
        >
          <GitHubMark className="h-4 w-4 shrink-0" />
          <span>
            This project is{" "}
            <span className="font-medium text-foreground-muted transition group-hover:text-brand group-hover:underline">
              open source
            </span>{" "}
            on{" "}
            <span className="font-medium text-foreground-muted transition group-hover:text-brand group-hover:underline">
              GitHub
            </span>
          </span>
        </a>
        {/* Wide viewports get the gutter-parked toggle from App instead. At the foot of
            the page the menu has to open upward, or it would fall off the bottom, and
            right-aligned so it grows toward the centre rather than off a narrow screen. */}
        <ThemeToggle className="lg:hidden" menuPlacement="above" menuAlign="right" />
      </div>
    </footer>
  );
}
