# CCA-F Practice Exam

A scenario-based practice exam for the **Claude Certified Architect – Foundations (CCA-F)** certification, built as a single-page React app (Vite + Tailwind CSS). All UI and content are in English.

The app mirrors the real exam's structure: 5 weighted domains, 6 production scenarios (the real exam draws 4 of 6), multiple-choice questions with one correct answer and three distractors, an explanation after every answer, and a scaled score (100–1000, passing at 720).

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

## Practice modes

- **Balanced exam** (12 / 24 / 40 questions) — questions drawn to match the exact domain weights.
- **Full mock exam** — 60 questions / 120-minute countdown, like the real exam, biased toward the harder question pool. Auto-submits when time runs out.
- **Scenario mock** — 4 of 6 scenarios drawn at random.
- **Domain drill** / **Scenario drill** — focus on a single domain or scenario.

## Saving results

From the results screen (or the **Save** button in the exam header at any time) you can download a `.txt` report. The filename encodes the test type, the number of questions, and the start timestamp, e.g. `mock-60q-20260624-2231.txt`. The file contains every answered question, your answer, the correct answer, and the explanation.

Note: the report is generated client-side on click (browsers cannot silently write files to disk), so nothing is created until you press download.

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
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src
    ├── main.jsx        # entry point
    ├── index.css       # Tailwind directives
    └── App.jsx         # the entire app + question bank
```

## Editing the question bank

All questions live in the `BANK` array near the top of `src/App.jsx`. Each entry:

```js
{
  id: "S1Q1",          // unique id
  s: 1,                // scenario (1–6)
  d: 1,                // domain (1–5)
  ts: "1.4",           // task statement reference
  diff: "hard",        // optional; omit for standard difficulty
  q: "Question text…",
  choices: [
    { t: "Correct option", c: true },
    { t: "Distractor" },
    { t: "Distractor" },
    { t: "Distractor" },
  ],
  exp: "Explanation shown after answering.",
}
```

Choice order is shuffled at runtime, so the correct answer is never positionally fixed. The mock exam pulls from questions tagged `diff: "hard"` first.

## Deploy

The build is a fully static site (`dist/`), so any static host works:

- **Vercel** — framework preset "Vite", build command `npm run build`, output dir `dist`.
- **Netlify** — build command `npm run build`, publish dir `dist`.
- **GitHub Pages / Cloudflare Pages / S3 + CloudFront** — upload the contents of `dist/`.

## Disclaimer

This is an independent study aid with original questions written in the style of the official Exam Guide. It is not affiliated with or endorsed by Anthropic, and contains no real exam questions.
