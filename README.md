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

## Scoring, persistence & history

- The **scaled score is weighted by domain**: each domain's hit-rate is weighted by its official exam weight (renormalized over the domains present), then scaled to 100–1000. It's a faithful estimate, not Anthropic's proprietary scaling.
- An **in-progress exam survives a refresh** — state is persisted to IndexedDB (via redux-persist) and the exact question draw is rebuilt from a stored seed.
- Finished exams are kept as a compact **history** (score, per-domain summary, completion time) shown on the home screen, including your average score and average completion time.

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
    ├── data/            # questions.json + domains/scenarios + Zod schema
    ├── lib/             # pure logic: exam-builder, scoring, report, session, …
    ├── store/           # Redux Toolkit slices, thunks, persistence
    ├── components/      # screens + atoms
    └── hooks/
```

## Editing the question bank

All questions live in `src/data/questions.json`, validated against the Zod schema in `src/data/schema.ts`. After any change, run `npm test` — the schema test rejects malformed entries (missing fields, not exactly one correct choice, bad domain/scenario refs, too few questions to fill a weighted mock).

See [`CLAUDE.md`](./CLAUDE.md) for the full question-authoring guide (schema, conventions, quality bar) and `references/` for the source material to ground new questions in.

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
