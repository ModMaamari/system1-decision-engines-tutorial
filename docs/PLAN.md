# System 1 Decision Engines: an interactive tutorial

## Goal

A local web app that teaches **non-autoregressive System 1 decision engines** in depth, using
[Laya](https://github.com/NandhaKishorM/laya) as the reference implementation. It covers what
they are, how they work inside, how they are trained and calibrated, how to use them, and how
to apply them, including inside agents. Every number and mechanism in the app comes from the
Laya repository (source code, README, `BENCHMARKS.md`, `docs/`, the fine-tuning notebook) or
from standard literature. Simulations are labelled as simulations.

## Principles

- **Factual.** Laya-specific claims are sourced from the repository. Interactive demos that
  re-implement Laya logic (option rendering, sequence budgets, softmax/temperature, confidence,
  proper-scoring reward, the RLCD update, ECE, routing) mirror the Python code and are unit
  tested. Where a demo simplifies (tokenizer, language detection, toy training), the page says so.
- **Interactive.** Each chapter has at least one hands-on figure.
- **Professional.** Clean typography, light and dark themes, responsive layout, keyboard
  navigation, respects `prefers-reduced-motion`, and works offline (fonts bundled).

## Stack

Vite + React + TypeScript, hand-written CSS with design tokens, KaTeX for math, SVG for
charts and diagrams. Vitest + Testing Library (jsdom) for tests. Hash routing, so the build is
a static folder.

## Curriculum

| Part | # | Chapter | Main interactive |
|---|---|---|---|
| I. Foundations | 1 | What is a System 1 decision engine? | Hero: one forward pass vs token-by-token |
| | 2 | Fast and slow: System 1 vs System 2 | Sort tasks into System 1 / System 2 |
| | 3 | Autoregressive vs non-autoregressive | Latency race simulator |
| II. Inside the engine | 4 | The decision primitives: choice, score, noul | Question builder (JSON, rendered options, output shape) |
| | 5 | Building the input sequence | Token layout and budget visualiser |
| | 6 | The forward pass | Animated architecture walkthrough |
| | 7 | From logits to answers | Logit and temperature playground |
| III. Training and calibration | 8 | Proper scoring rules | Honest-forecaster reward curves |
| | 9 | RLCD: training with proper-scoring rewards | Live toy RLCD trainer |
| | 10 | Calibration and temperature scaling | Reliability diagram, ECE, temperature fit |
| IV. Using it | 11 | The router and the checkpoints | Language/script routing demo |
| | 12 | The API in practice | Code tabs, annotated response |
| | 13 | Production patterns | Confidence-gating coverage curve, staged adoption, hooks |
| V. Agents and applications | 14 | System 1 inside agents | Agent pipeline simulator |
| | 15 | Use-case design lab | Use-case gallery and schema design checklist |
| VI. Evaluate and review | 16 | Evaluation, benchmarks and honest limits | Benchmark charts |
| | 17 | Knowledge check | Quiz with explanations |
| | 18 | Glossary and references | Searchable glossary |

## Atomic commits

Each commit is implemented, then tested (type check, unit tests, production build, and a
browser check for UI changes), then committed.

1. `docs: add project plan and atomic commit list`
2. `chore: scaffold Vite + React + TypeScript app`
3. `test: set up Vitest with jsdom and Testing Library`
4. `feat(ui): design tokens, bundled fonts and light/dark theme`
5. `feat(app): chapter registry, hash routing and app shell`
6. `feat(app): reading progress, prev/next and keyboard navigation`
7. `feat(ui): content primitives (callout, figure, code, math, tabs)`
8. `feat(lib): decoding maths (softmax, temperature, confidences)`
9. `feat(ui): SVG chart primitives`
10. `feat(content): ch1 introduction with one-pass hero animation`
11. `feat(content): ch2 System 1 vs System 2 with sorting exercise`
12. `feat(content): ch3 autoregressive vs non-autoregressive race`
13. `feat(lib): question validation and option rendering`
14. `feat(content): ch4 decision primitives and question builder`
15. `feat(lib): approximate tokenizer and sequence builder with budgets`
16. `feat(content): ch5 input sequence visualiser`
17. `feat(content): ch6 animated forward-pass walkthrough`
18. `feat(content): ch7 logits-to-answers playground`
19. `feat(lib): proper scoring rules and composite reward`
20. `feat(content): ch8 proper scoring rules explorer`
21. `feat(lib): toy RLCD trainer`
22. `feat(content): ch9 RLCD training simulator`
23. `feat(lib): calibration metrics and temperature fitting`
24. `feat(content): ch10 calibration lab`
25. `feat(lib): simplified script and language detection`
26. `feat(content): ch11 router and checkpoints`
27. `feat(content): ch12 API walkthrough with annotated response`
28. `feat(content): ch13 production patterns`
29. `feat(content): ch14 System 1 inside agents`
30. `feat(content): ch15 use-case design lab`
31. `feat(content): ch16 evaluation, benchmarks and limits`
32. `feat(content): ch17 knowledge check quiz`
33. `feat(content): ch18 glossary and references`
34. `feat(app): command palette search`
35. `fix: accessibility, responsive and reduced-motion pass`
36. `docs: README with usage, structure and sources`

## Sources

- Laya repository: `README.md`, `BENCHMARKS.md`, `AGENTS.md`, `docs/` (fine-tuning, staged
  adoption, structured decisions, hooks, LangChain), `laya/common.py` (model, sequence format,
  reward, ECE, confidence), `laya/agent.py` (decoding, batching, long documents),
  `laya/router.py` and `laya/lang.py` (routing), `laya/presets.py`, the fine-tuning notebook
  `notebooks/laya_finetune_typed_decisions_2xT4_kaggle.ipynb`.
- Literature: Kahneman, *Thinking, Fast and Slow* (2011); Gneiting & Raftery, "Strictly Proper
  Scoring Rules, Prediction, and Estimation" (2007); Guo et al., "On Calibration of Modern
  Neural Networks" (2017); Shao et al., "DeepSeekMath" (2024, GRPO); Warner et al.,
  "ModernBERT" (2024).

## How the history differed from the plan

The 36 planned commits were made in order, with three small additions where testing found
something worth its own commit:

- `fix(app): keep the completed check visible on the active chapter` (after chapter 1)
- `docs(content): mark the ch4 negation example as illustrative` (before chapter 15)
- a fact-check pass against the Laya repository, committed after the README

Run `git log --oneline --reverse` for the full list.

