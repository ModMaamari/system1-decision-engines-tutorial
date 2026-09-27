# System 1 Decision Engines: an interactive tutorial

An in-depth, interactive web tutorial on **non-autoregressive System 1 decision engines**: models
that answer typed questions about an input (a ticket, an email, a prompt, an agent trace) in a
single forward pass, returning a calibrated probability for every allowed answer instead of
generated text. It uses [Laya](https://github.com/NandhaKishorM/laya) as the reference
implementation and covers what these engines are, how they work inside, how they are trained and
calibrated, how to use and deploy them, and how to apply them, including inside agents.

## Contents

| Part | Chapters |
|---|---|
| I. Foundations | 1 What is a System 1 decision engine? · 2 Fast and slow thinking for machines · 3 Autoregressive vs non-autoregressive |
| II. Inside the engine | 4 The decision primitives (choice, score, noul) · 5 Building the input sequence · 6 Inside the forward pass · 7 From logits to answers |
| III. Training and calibration | 8 Proper scoring rules · 9 RLCD: training with honest rewards · 10 Calibration and temperature scaling |
| IV. Using it | 11 Checkpoints and the router · 12 The API in practice · 13 Production patterns |
| V. Agents and applications | 14 System 1 inside agents · 15 Use-case design lab |
| VI. Evaluate and review | 16 Evaluation, benchmarks and limits · 17 Knowledge check · 18 Glossary and references |

Every chapter has at least one hands-on figure: a latency race, a question builder that runs
Laya's validation, a token-budget visualiser, an animated forward pass, a logits and temperature
playground, a proper-scoring-rule explorer, a live RLCD trainer, a calibration lab, a routing
demo, an annotated API response, a confidence-gating and cost simulator, an agent pipeline
simulator, a decision-design wizard, benchmark charts and a quiz.

## Run it

Requires Node.js 22.12 or newer (Vitest needs it; developed on Node 24).

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # static production build in dist/, servable from any path on any static host
npm run preview    # serve the production build locally
npm test           # unit, component and accessibility tests (Vitest + jsdom + axe-core)
npm run typecheck  # TypeScript, strict
npm run check      # typecheck + tests + build
```

The app has no backend and makes no network requests at run time; fonts are bundled, so it works
offline. Serve `dist/` over HTTP (for example with `npm run preview` or any static file server):
browsers block module scripts when `index.html` is opened directly from disk. Reading progress, the theme and the best quiz score are kept in the browser's
localStorage.

## How accuracy is handled

- **Laya facts are sourced.** Numbers, defaults and behaviours come from Laya's README,
  BENCHMARKS.md, docs, source code and fine-tuning notebook (September 2026). Published figures
  live in one file, [`src/data/laya.ts`](src/data/laya.ts), with spot-check tests.
- **Ported logic is tested against Laya.** The interactive figures run TypeScript ports of
  Laya's option rendering and question validation, sequence budgets, answer decoding and
  temperature clamp, composite proper-scoring reward, ECE, and routing detection. Tests pin
  these to outputs recorded from the Python library (for example the router's exact reason
  strings, and `proper_reward` values from a NumPy transliteration).
- **Simplifications are labelled.** Figures are tagged *Interactive* (real formulas),
  *Simulation* (synthetic or scripted data), *Diagram* or *Measured data*. The tokenizer, the
  language detector and the one-item RLCD trainer are declared simplifications on the page
  where they appear.

## Project structure

```
src/
  App.tsx                 app shell: routing, progress, keyboard shortcuts, search
  components/             layout (top bar, sidebar, chapter view), UI primitives, SVG charts
  content/
    chapters.ts           chapter registry (parts, titles, summaries, lazy loading)
    chapters/*.tsx        the 18 chapters
    quiz.ts, glossary.ts  quiz questions, glossary terms and references
  figures/                one component per interactive figure, each with tests
  lib/                    decision maths, question rendering, sequence budgets, scoring rules,
                          toy RLCD, calibration, language detection, search, scales
  data/                   published Laya numbers; language tables generated from laya/lang.py
  styles/                 design tokens (light and dark), layout, components, charts, figures
docs/PLAN.md              the plan and the list of atomic commits
```

## Stack

Vite, React and TypeScript; hand-written CSS with design tokens; KaTeX for maths; SVG for charts
and diagrams; Vitest, Testing Library and axe-core for tests.

## Accessibility

Keyboard navigation throughout (left/right arrows between chapters, Ctrl/Cmd+K or `/` to search,
accessible tabs, sliders and dialogs), a skip link, WCAG AA text contrast in both themes, charts
with text alternatives and table views, `prefers-reduced-motion` support, and a responsive layout
tested at 375px. axe-core runs on every chapter in the test suite.

## Credits

Laya is developed by Convai Innovations and released under the Apache License 2.0. The language
tables in `src/data/langData.ts` are generated from Laya's `laya/lang.py`. This tutorial is an
independent educational project and is not affiliated with Laya's authors or with TypeSafe.
