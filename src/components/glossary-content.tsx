import { useEffect, useMemo, useRef, useState } from "react";
import { GLOSSARY } from "../data/glossary";
import type { GlossaryEntry } from "../data/schema";
import { ALPHABET, filterEntries, groupByLetter, initialLetter } from "../lib/glossary-search";

const LETTER_BASE =
  "flex h-7 w-7 items-center justify-center rounded font-mono text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid";

function LetterRow({
  selected,
  available,
  onSelect,
}: {
  selected: string | null;
  available: Set<string>;
  onSelect: (letter: string | null) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={selected === null}
        className={`${LETTER_BASE} w-auto px-2 ${
          selected === null
            ? "bg-brand-surface text-brand-on-surface"
            : "text-foreground-muted hover:bg-foreground/[0.06]"
        }`}
      >
        All
      </button>
      {ALPHABET.map((letter) => {
        const has = available.has(letter);
        return (
          <button
            key={letter}
            type="button"
            disabled={!has}
            onClick={() => onSelect(letter)}
            aria-pressed={selected === letter}
            aria-label={has ? `Terms starting with ${letter}` : `No terms starting with ${letter}`}
            className={`${LETTER_BASE} ${
              !has
                ? "cursor-not-allowed text-foreground-disabled"
                : selected === letter
                  ? "bg-brand-surface text-brand-on-surface"
                  : "text-foreground-muted hover:bg-foreground/[0.06]"
            }`}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}

function Entry({ entry }: { entry: GlossaryEntry }) {
  return (
    <div className="border-t border-border-subtle pt-3 first:border-0 first:pt-0">
      <dt className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-sm font-semibold text-foreground">{entry.term}</span>
        {entry.also && (
          <span className="font-mono text-[11px] text-foreground-faint">
            also {entry.also.join(", ")}
          </span>
        )}
      </dt>
      <dd className="mt-1 text-sm leading-relaxed text-foreground-muted">{entry.def}</dd>
      {entry.more && (
        <dd className="mt-1.5 text-sm leading-relaxed text-foreground-subtle">{entry.more}</dd>
      )}
    </div>
  );
}

export default function GlossaryContent() {
  const [query, setQuery] = useState("");
  const [letter, setLetter] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Both shells open straight onto the search box — it is the fastest route to a term,
  // and inside the exam modal it is the only one that does not mean scrolling.
  useEffect(() => searchRef.current?.focus(), []);

  /* Derived from the whole glossary rather than the current results, so the row never
     rearranges itself while you type. */
  const available = useMemo(() => new Set(GLOSSARY.map((entry) => initialLetter(entry.term))), []);

  const groups = useMemo(() => {
    const matched = filterEntries(GLOSSARY, query);
    const scoped = letter
      ? matched.filter((entry) => initialLetter(entry.term) === letter)
      : matched;
    return groupByLetter(scoped);
  }, [query, letter]);

  const count = groups.reduce((total, group) => total + group.entries.length, 0);

  /* The two filters are mutually exclusive. Composing them would let you sit on a letter
     that the row is simultaneously showing as populated while nothing is listed. */
  const onQueryChange = (next: string) => {
    setQuery(next);
    setLetter(null);
  };

  const onLetterSelect = (next: string | null) => {
    setLetter(next);
    setQuery("");
  };

  return (
    <div>
      <input
        ref={searchRef}
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search terms and definitions…"
        aria-label="Search the glossary"
        className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-foreground-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-vivid"
      />

      <LetterRow selected={letter} available={available} onSelect={onLetterSelect} />

      <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-foreground-faint">
        {query ? `${count} matching ${count === 1 ? "term" : "terms"}` : `${count} terms`}
      </p>

      {count === 0 ? (
        <p className="mt-4 text-sm text-foreground-subtle">
          No term matches “{query}”. Try a shorter word, or browse by letter.
        </p>
      ) : (
        <div className="mt-4 space-y-6">
          {groups.map((group) => (
            <section key={group.letter}>
              <h3 className="font-mono text-xs uppercase tracking-widest text-brand">
                {group.letter}
              </h3>
              <dl className="mt-2 space-y-3">
                {group.entries.map((entry) => (
                  <Entry key={entry.term} entry={entry} />
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
