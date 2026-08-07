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
- `src/data/schema.ts` — Zod schema + `Question`/`Choice` types for the bank.
- `src/data/domains.ts`, `src/data/scenarios.ts` — exam blueprint (weights, scenarios).
- `src/data/questions.ts` — typed loader (`BANK`).
- `src/App.tsx` — UI + exam logic (being decomposed into `src/components/` and `src/lib/`).
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
