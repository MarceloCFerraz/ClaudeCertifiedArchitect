# CCA-F Practice Exam — project guide

A scenario-based practice exam for the **Claude Certified Architect – Foundations
(CCA-F)** certification. Static SPA (Vite + React + Tailwind), results stay
on-device, no backend. See `README.md` for the user-facing overview.

## Commands

```bash
npm run dev        # local dev server (http://localhost:5173)
npm run build      # production build → dist/
npm run typecheck  # tsc --noEmit
npm run check      # Biome lint + format check
npm run format     # Biome format --write
npm test           # Jest (schema + logic unit tests)
```

## Where things live

- `src/data/questions.json` — the question bank (the source of truth for content).
- `src/data/glossary.json` — the glossary (see `## Glossary` below).
- `src/data/schema.ts` — Zod schemas + types for both: `Question`/`Choice`, `GlossaryEntry`.
- `src/data/domains.ts`, `src/data/scenarios.ts` — exam blueprint (weights, scenarios).
- `src/data/questions.ts`, `src/data/glossary.ts` — typed loaders (`BANK`, `GLOSSARY`).
- `src/App.tsx` — UI + exam logic (being decomposed into `src/components/` and `src/lib/`).
- `src/store/` — `exam` (the live run), `paused` (parked runs), `history` (finished attempts).
- `test/unit/` — schema/logic tests (`npm test`). No UI tests by design.
- `references/` — primary source material for authoring (see `references/README.md`);
  the actual PDFs/guide are gitignored — run `references/fetch-sources.sh` to pull them.

## Conventions

- Package manager: **npm**. Lint/format: **Biome**. Tests: **Jest + ts-jest + Sinon**, under `/test`.
- TypeScript everywhere; the tsconfig is currently lenient (gradual migration) and
  ratchets toward strict as `App.tsx` is decomposed into typed modules.
- All content and UI strings are **en-US English**.

## Theming (dark mode)

Colors go through **semantic tokens**, never raw palette classes. Each token is a CSS
variable defined twice in `src/index.css` — `:root` (light) and `.dark` (dark) — and
registered as a Tailwind color in `tailwind.config.js`. A component's classes are
therefore identical in both themes; only the active variable group changes.

```
surfaces   bg-background  bg-card  bg-muted  bg-secondary
text       text-foreground  -muted  -subtle  -faint  -disabled
borders    border-border  -strong  -subtle  -hover  -hover-strong
buttons    bg-primary / text-primary-foreground / hover:bg-primary-hover / text-primary-accent
brand      text-brand  bg-brand-vivid  bg-brand-surface  text-brand-on-surface  …
domain     text-domain          (teal — domain labels, off the scenario orange; teal
                                 rather than emerald so it stays apart from success)
states     bg-success-surface  text-success-text  bg-destructive-surface  …
```

Use these in new components rather than `stone-*`/`orange-*` or a `dark:` variant —
there are no `dark:` variants in this codebase by design. Opacity modifiers work
(`bg-foreground/10`). Two deliberate exceptions: the exam HUD keeps fixed `stone-*`
text because it is dark chrome in *both* themes, and `text-white` stays on saturated
success/destructive/brand fills.

The theme itself lives in `src/lib/theme.ts` (pure, dependency-injected, unit-tested)
and `src/components/theme-provider.tsx`. It is a three-way preference — system / light
/ dark — persisted to `localStorage`, **not** to the Redux store: the store persists to
IndexedDB asynchronously, which cannot be read before first paint. The inline script in
`index.html` applies the theme pre-paint to avoid a flash; its storage key must stay in
sync with `THEME_STORAGE_KEY`.

## Runs, pausing and the clock

A run **carries its own draw**. `exam.questions` is persisted rather than rebuilt from the
seed, because `AnswerRecord.selected` is a positional letter assigned *after* the choice
shuffle — replaying a seed against an edited bank would silently re-point stored answers at
different text. Pausing moves the whole run (draw included) into the `paused` slice via
`toPausedRun` in `src/lib/paused-run.ts`; resuming restores it verbatim. `src/lib/drift.ts`
compares a parked draw against the current `BANK` so the panel can *report* divergence — it
never blocks or rewrites a resume.

The clock is **derived, not counted**. `ExamClock` (`elapsedSeconds`, `remainingSeconds`,
`runningSince`) is folded only when a segment starts or stops; `src/lib/exam-clock.ts` derives
elapsed/remaining from an injected `now`. There is no per-second dispatch — `ExamScreen` ticks
a local `useState` for display only. Keep it that way: a store tick would rewrite the whole
persisted run (~58 KB for a mock) to IndexedDB every second, and a stored countdown stalls
whenever the browser throttles a background tab.

`src/store/boot.ts` runs once via `PersistGate`'s `onBeforeLift`, before anything renders — it
restarts the clock for a run left open, and clears any stored run that has no draw.

---

## Glossary

`src/data/glossary.json` defines the vocabulary the exam takes for granted, for readers
who are not deeply technical. It surfaces in two places: a browsable list (a full page
from the home screen, an overlay from the exam HUD and the results Review card), and as
dashed underlines on terms inside **explanations and the scenario/domain framing**, which
reveal a definition on hover, keyboard focus or tap.

### Entry shape

```jsonc
{
  "term": "Context window",              // identity; no separate id — a slug would duplicate it
  "def":  "One sentence, ≤ 160 chars.",  // the ONLY thing the hover tooltip renders
  "more": "Optional longer form…",       // OPTIONAL — shown on the glossary page only
  "also": ["context windows"],           // OPTIONAL aliases; feed search AND in-text matching
  "annotate": false                      // OPTIONAL opt-out of in-text underlining
}
```

Entries are listed alphabetically; the test asserts it.

- **The `def` cap is load-bearing, not cosmetic.** The tooltip has no portal, so
  `src/lib/tooltip-position.ts` estimates its height from a constant to decide whether to
  open above or below the term. Raise `DEF_MAX_CHARS` and long definitions open
  off-screen. Anything longer belongs in `more`.
- **`more` is searchable**, so a phrase a reader would plausibly type ("hub-and-spoke")
  can live there rather than being forced into `also`. Putting it in `also` would also
  make it an *underlining* surface, which is usually not what you want.
- **Use `annotate: false` for terms that are also ordinary English** — *turn*, *state*,
  *batch* — and for the ones that read as a common phrase, like *Task tool* (which
  otherwise matches "off-task tools"). Opted-out entries still appear on the page and in
  search; they are simply never underlined in prose. Keep ≤ 2-character acronyms opted
  out too: matching is case-insensitive, so `CI` would underline a stray "ci".

### Matching rules (`src/lib/glossary-terms.ts`)

Longest surface wins (alternation is ordered by length), boundaries are asserted with
character classes rather than a lookbehind (an unsupported lookbehind throws at
*construction* and takes the whole bundle down), and regular plurals are handled by
`(es|s)?` so entries do not each author one — irregular forms go in `also`.

Underlines are rationed by **density, not count**: roughly one per
`CHARS_PER_ANNOTATION` characters, capped at `MAX_ANNOTATIONS`. A flat count is the wrong
shape — the bank's densest explanation is 193 characters and matches seven terms, and
five underlines there would still be a stripe every four words. Matches are taken in
reading order, so what survives the budget is the concept the explanation *teaches*,
ahead of its closing list of why the other options are wrong.

Two kinds of text, two budgets. `GlossaryText` takes an optional `max`:

| Text | Budget | Why |
| --- | --- | --- |
| Explanations (`exam-screen`, `results-screen`) | default, length-rationed | prose making an argument; stripes would fight the reading |
| Scenario blurbs, domain descriptions (`scenario-card`, `scenario-domains`) | `ANNOTATE_ALL` | already an inventory of jargon; rationing it just picks arbitrary winners |

`test/unit/glossary-annotation.test.ts` runs the real matcher over the real bank and over
the framing text. **If it fails, thin the glossary rather than raising the limits** — it
is the signal that the term list drifted toward noise. It also asserts every scenario
blurb and domain description defines at least one term, since that framing is where a
missing entry leaves someone stuck before they even reach a question.

### Deliberate limits

- Never annotate a question stem or its choices: underlining some words and not others
  nudges the reader toward an answer before they have committed. The scenario blurb and
  domain descriptions are safe because they are identical for every question in that
  scenario, so they carry no per-question signal.
- No "see also" cross-links between entries.
- The glossary's open state is React context (`glossary-provider.tsx`), **not** Redux —
  every slice in the store is persisted, and reopening onto a glossary you left open days
  ago would be wrong.
- The overlay has no focus trap. Escape and outside-click close it, focus enters on open
  and is restored on close, but Tab still reaches the exam behind the scrim.
- A perfect run has no glossary button on the results screen: it lives in the Review card
  header, which only renders when there is something to review.

---

## Authoring new questions

When asked to generate questions, **ground them in the real sources** in
`references/sources/` (Anthropic Exam Guide + FAQs, the community guide) rather than
inventing facts. Match the existing style in `src/data/questions.json` and the schema
in `src/data/schema.ts`. After adding any questions, run `npm test` — the schema test
rejects malformed entries.

### Question shape

```jsonc
{
  "id": "S1Q7",          // unique. Convention: "S<scenario>Q<n>"
  "s": 1,                 // scenario 1–6 (see below)
  "d": 1,                 // domain 1–5 (see below)
  "ts": "1.4",            // task-statement reference from the Exam Guide
  "diff": "hard",         // OPTIONAL — include only for genuinely harder items
  "q": "Scenario-based question stem…",
  "choices": [            // EXACTLY 4; EXACTLY ONE has "c": true
    { "t": "The correct option", "c": true },
    { "t": "A plausible distractor" },
    { "t": "A plausible distractor" },
    { "t": "A plausible distractor" }
  ],
  "exp": "Why the correct answer is right (and, implicitly, why the others are wrong)."
}
```

Choice order is shuffled at runtime, so never phrase a choice as "all/none of the
above" or rely on position. The mock exam pulls `diff: "hard"` items first.

### Domains (and weights — keep the bank distribution healthy)

| Domain | Area | Weight |
| --- | --- | --- |
| 1 | Agentic Architecture & Orchestration | 27% |
| 2 | Tool Design & MCP Integration | 18% |
| 3 | Claude Code Configuration & Workflows | 20% |
| 4 | Prompt Engineering & Structured Output | 20% |
| 5 | Context Management & Reliability | 15% |

A weighted draw allocates by these weights, so each domain needs enough questions to
fill its share of a 60-question mock (the schema test enforces this floor).

### Scenarios

1. Customer Support Resolution Agent · 2. Code Generation with Claude Code ·
3. Multi-Agent Research System · 4. Developer Productivity with Claude ·
5. Claude Code for Continuous Integration · 6. Structured Data Extraction

### Quality bar

- One unambiguously correct answer; three distractors that are *plausible* but reflect
  real anti-patterns or common misconceptions, not obviously wrong throwaways.
- **Balance option lengths** — keep all four options in a tight length band (roughly
  90–150 chars, none more than ~1.4× the shortest) and make sure the correct answer is
  **not** the longest. Otherwise the answer is guessable by length alone, which the real
  exam avoids. `test/unit/answer-balance.test.ts` enforces this bank-wide.
- The explanation should teach: state why the right answer is right and why the
  tempting distractor is wrong.
- Prefer questions that test judgment in the scenario over trivia recall.
- Tag `d`, `s`, and `ts` accurately; only flag `diff: "hard"` when warranted.
