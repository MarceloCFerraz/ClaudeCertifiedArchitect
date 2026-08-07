# CCA-F Practice Exam

A scenario-based practice exam for the **Claude Certified Architect – Foundations (CCA-F)** certification, built as a static single-page app (Vite + React + TypeScript + Tailwind CSS). All UI and content are in English, and **results stay on your device** — there is no backend.

The app mirrors the real exam's structure: 5 weighted domains, 6 production scenarios (the real exam draws 4 of 6), multiple-choice questions with one correct answer and three distractors, an explanation after every answer, and a weighted scaled score (100–1000, passing at 720).

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

Build and preview a production bundle:

```bash
npm run build    # outputs to dist/
npm run preview
```

Quality gates (also run in CI):

```bash
npm run check      # Biome lint + format
npm run typecheck  # tsc --noEmit (strict)
npm test           # Jest unit/logic tests
```

> Requires Node ≥ 22.4 (the test runner uses `--no-experimental-webstorage`).

## Practice modes

- **Balanced exam** (12 / 24 / 40 questions) — questions drawn to match the exact domain weights.
- **Full mock exam** — 60 questions / 120-minute countdown, like the real exam, biased toward the harder question pool. Always timed; auto-submits when time runs out.
- **Scenario mock** — 4 of 6 scenarios drawn at random.
- **Domain drill** / **Scenario drill** — focus on a single domain or scenario.

Tick **Timed · 2 min/question** before starting to add a countdown to any mode (the full mock is always timed). A timed run that expires jumps to the results screen with your partial answers preserved.

## Answering a question

By default, clicking a choice **selects** it — nothing is revealed and the score does not
move — and a **Submit answer** button below the choices commits it. Click the same choice
again to take the pick back. This is the default because reading a long question and
pointing at whatever looks best so far shouldn't score it.

If you prefer the answer the moment you click, flip the **⏎ Confirm / ⚡ Instant** button in
the exam header, or untick **Confirm answers explicitly** on the home screen — they are the
same setting, it can be changed mid-question, and it is remembered between visits. Switching
never commits or discards a pick you have waiting.

Questions with a pick still waiting show an orange square in the progress tracker, and the
exam won't finish until every one of them is submitted.

Every choice has a small **scissors** under its letter. Click it to rule that option out: the text is struck through and the option stops being selectable, which is the ordinary way to work a four-option question down to two. It is always reversible — click the scissors again to bring the option back — and crossing out has no effect on your score. Cross-outs are yours until you answer, then they stay on screen alongside the result, so ruling out what turned out to be the right answer is visible rather than quietly forgotten.

## Pausing and resuming

Need to stop halfway? Hit **✕** in the exam header and choose **Pause & exit**. The run moves to a **Paused exams** card on the home screen, where you can **Resume** it exactly where you left off — same questions, same order, same answers — or **Delete** it. Several runs can sit there at once, so starting a drill never costs you a half-finished mock. Choosing **Discard** instead throws the run away immediately.

The clock stops while a run is paused, for both the countdown on a timed exam and the time recorded in your history, so a bathroom break doesn't cost you the exam.

A paused run keeps its own copy of the questions it was dealt and always replays that copy, even if `questions.json` changed in the meantime. When it no longer matches the current bank, the card says how many questions were removed or edited — the run still resumes exactly as drawn, so it's up to you whether to finish it or delete it and start fresh.

## Glossary

The exam leans on vocabulary it never stops to define — *synthesis*, *fan-out*,
*idempotent*, *subagent*. The **Glossary** card on the home screen opens a browsable list
of 80-odd terms in plain English: search as you type, or click through A–Z.

You don't have to go looking for it. Terms are <u>underlined</u> where you meet them —
in the scenario and domain framing above each question, and in the explanation after you
answer. Hover, tap, or Tab to one and its definition appears without taking you off the
question. During a run the **Glossary** button in the exam header opens the full list as
an overlay, so looking something up never costs you your place (the clock keeps running,
as it would in the real exam). The results screen has one too, in the header of the
review list.

Never the question itself or its options — highlighting some words and not others would
hint at the answer. The scenario framing is safe because it is identical for every
question in that scenario.

## Scoring, persistence & history

- The **scaled score is weighted by domain**: each domain's hit-rate is weighted by its official exam weight (renormalized over the domains present), then scaled to 100–1000. It's a faithful estimate, not Anthropic's proprietary scaling.
- An **in-progress exam survives a refresh** — the run, including its question draw, is persisted to IndexedDB via redux-persist.
- Finished exams are kept as a compact **history** (score, per-domain summary, time on task) shown on the home screen, including your average score and average completion time.

> Everything is stored per-browser, and two tabs of the app share that storage without knowing about each other — the last one to write wins. Keep it to one tab if you have runs you care about.

## Saving results

From the results screen (or the **Save** button in the exam header at any time) you can download a `.txt` report. The filename encodes the test type, the number of questions, and the start timestamp, e.g. `mock-60q-20260624-2231.txt`. The file contains every answered question, your answer, the correct answer, and the explanation.

> The report is generated client-side on click (browsers cannot silently write files to disk), so nothing is created until you press download.

## Exam blueprint

Domain weights:

| Domain | Area | Weight |
| --- | --- | --- |
| D1 | Agentic Architecture & Orchestration | 27% |
| D2 | Tool Design & MCP Integration | 18% |
| D3 | Claude Code Configuration & Workflows | 20% |
| D4 | Prompt Engineering & Structured Output | 20% |
| D5 | Context Management & Reliability | 15% |

Real-exam reference: 60 questions, 120 minutes, passing score 720/1000.

## Project structure

```
.
├── index.html
├── public/              # favicon, robots.txt
└── src
    ├── main.tsx         # entry: Provider + PersistGate + ErrorBoundary
    ├── App.tsx          # routes on the current screen
    ├── data/            # questions.json + glossary.json + domains/scenarios + Zod schemas
    ├── lib/             # pure logic: exam-builder, scoring, report, session, …
    ├── store/           # Redux Toolkit slices, thunks, persistence
    ├── components/      # screens + atoms
    └── hooks/
```

## Editing the question bank

All questions live in `src/data/questions.json`, validated against the Zod schema in `src/data/schema.ts`. After any change, run `npm test` — the schema test rejects malformed entries (missing fields, not exactly one correct choice, bad domain/scenario refs, too few questions to fill a weighted mock).

The glossary lives alongside it in `src/data/glossary.json`, under the same rules — its
own Zod schema, its own test. Adding a term that starts matching common words will fail
the build: a test runs the real matcher over every explanation in the bank and rejects
term lists that would turn them into stripes.

See [`CLAUDE.md`](./CLAUDE.md) for the full question-authoring guide (schema, conventions, quality bar), the glossary contract, and `references/` for the source material to ground new questions in.

## Deploy

Live at **https://marcelocferraz.github.io/ClaudeCertifiedArchitect/**.

Pushing to `main` runs `.github/workflows/deploy.yml`, which reuses the CI workflow
(`check` + `typecheck` + `test`) and only publishes `dist/` to GitHub Pages once those
pass. One-time setup: **Settings → Pages → Source → GitHub Actions**.

Because this is a *project* site, production builds are served from `/ClaudeCertifiedArchitect/`
— that prefix is the `base` in `vite.config.ts`. Change it if the repo is renamed, moved to a
`<user>.github.io` repo, or put behind a custom domain (in those cases `base` becomes `/`).

The build is a plain static bundle, so other hosts work with no config change beyond `base`:

- **Vercel** — framework preset "Vite", build command `npm run build`, output dir `dist`.
- **Netlify** — build command `npm run build`, publish dir `dist`.
- **Cloudflare Pages / S3 + CloudFront** — upload the contents of `dist/`.

## Disclaimer

This is an independent study aid with original questions written in the style of the official Exam Guide. It is not affiliated with or endorsed by Anthropic, and contains no real exam questions.
