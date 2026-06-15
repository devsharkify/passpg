# PassPG — NEET PG Previous-Year Mastery

A focused, exam-faithful study platform for **NEET PG** (the postgraduate medical entrance for MBBS graduates seeking MD / MS / Diploma / DNB seats). Built entirely around **previous-year question patterns** and the real NBEMS blueprint, with every answer explained the way a 30-year coaching head would.

> Designed for a fresh MBBS graduate to go from zero to pass: practise the recurring patterns, drill under exam-faithful timing, and revise the high-yield tables the night before.

## What's inside

- **547 high-yield MCQs** across all 19 NEET PG subjects, each with a detailed explanation, a one-line high-yield takeaway, and a PYQ insight. Modelled on the genuinely repeated themes (drug-of-choice lists, culture media, tumour markers, criteria/scores, image-described questions, etc.).
- **24 rapid-revision cards** — dense drug-of-choice / antidote / tumour-marker / criteria tables and buzzword one-liners.
- **Practice mode** — pick a subject (or mix), filter by difficulty or bookmarks, get instant feedback + explanation on every question.
- **Mock tests**
  - *Grand Test* — a ~200-question paper weighted to the real blueprint, run in **5 time-bound sections of 42 minutes each** exactly like NEET PG 2024+ (no going back once a section closes).
  - *Quick Test* — 25 mixed questions in 30 minutes.
  - *Subject test* — a timed drill on a single subject.
  - All with **+4 / -1 marking**, a question palette, flag-for-review, and a full solutions report with subject-wise breakdown.
- **Exam Pattern & Strategy** — the blueprint, marking, time-bound section rules, subject weightage chart, the 30-year coach's game plan, and the most-repeated themes.
- **Dashboard** — exam-date countdown, accuracy ring, weakest-subject map, and mock history. All progress persists in the browser (localStorage); no backend or login required.

## Run it

```bash
npm install
npm run dev      # http://localhost:5599
```

## Build & deploy

```bash
npm run build    # outputs static files to dist/
npm run preview  # preview the production build locally
```

`dist/` is a fully static bundle — deploy it to Vercel, Netlify, GitHub Pages, or any static host. No server or database needed.

## Tech

React + TypeScript + Vite + Tailwind CSS. React Router for navigation. Progress stored in `localStorage`.

## Content pipeline (how to grow the bank)

The question bank is compiled from raw source files into the data the app loads:

- Source questions live in `src/data/raw/*.json` (one file per subject cluster).
- `build-data.mjs` merges, validates (4 options, valid answer index, de-dupes), assigns IDs, and writes `src/data/questions.json` and `src/data/notes.json`.
- `src/data/examMeta.json` holds the exam blueprint, weightage, strategy, and repeated themes.

To add questions, append to the relevant `src/data/raw/*.json` file (same schema) and re-run the merge step, or edit `src/data/questions.json` directly.

## A note on the content

Questions are written to mirror previous-year NEET PG patterns and cover well-established, exam-standard facts from the standard textbooks (Robbins, Harrison, KDT, Bailey, Park, Ananthanarayan, Williams, etc.). They are study material for exam preparation — always verify clinical decisions against current standard texts and guidelines.
