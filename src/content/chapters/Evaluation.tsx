import { BarChart } from "../../components/charts/BarChart";
import { Callout } from "../../components/ui/Callout";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { Figure } from "../../components/ui/Figure";
import { KeyTakeaways, Lead, Source, TableWrap } from "../../components/ui/Blocks";
import { M } from "../../components/ui/Math";
import { CPU_LATENCY_MS, PUBLIC_DATASETS, T4_LATENCY_MS, THEMES, TYPED_DECISIONS } from "../../data/laya";

const ROW = `# one JSON object per line: state, questions, expected (by question id); tags and language optional
{"state": "I was charged twice, please refund me.",
 "questions": {"intent": {"type": "choice", "instructions": "What is the user asking for?",
                          "criteria": {"billing": "refunds or charges", "technical": "bugs or errors"}}},
 "expected": {"intent": "billing"}, "tags": ["billing"], "language": "en"}`;

const EVALS = `laya-evals validate data.jsonl                       # format check, no model needed
laya-evals run data.jsonl --model english --device cpu \\
    --min-accuracy 0.8 --max-ece 0.05 --score-within 0.25 --slice language \\
    --json report.json --markdown report.md
laya-evals compare report.json --baseline baseline.json --tolerance choice_accuracy=0.02
# exit code 1 when a threshold or tolerance fails: drop it into CI`;

const LIMITS: { title: string; body: string }[] = [
  { title: "Near chance zero-shot on specialised workflows", body: "0.362 and 0.352 on typed-decisions against 0.318 random and 0.461 majority class; 0.766 after fine-tuning." },
  { title: "Moderation does not hold up on held-out data", body: "0.530 accuracy, macro-F1 0.400 on held-out toxicity." },
  { title: "Keep choice questions under about 20 options", body: "Options share head_max_len; Banking77 (77 labels) scores 0.425 against 0.870 published for Jev." },
  { title: "Checkpoints ship over-confident", body: "Mean ECE 0.466 (laya) and 0.314 (multilingual, no fitted temperatures). Fit on your data." },
  { title: "score is the weakest primitive", body: "SST-5: 0.372. laya-multilingual rarely picks the first level; route English score questions to English." },
  { title: "The English checkpoint collapses outside English", body: "Confidently: Khmer 0.000 at 0.952 confidence. laya-multilingual is weaker on English. Route." },
  { title: "noul can follow its labels on laya", body: "The false:/true: words can dominate; a noul without criteria reads a generic pair. Give criteria, or override labels." },
  { title: "Boolean-word choice labels and negation", body: "Labels like yes/no can be followed instead of their descriptions; negated cancellations were classified as cancel_account." },
  { title: "act_probability carries no usable signal", body: "Reads 1.0 almost always; AUROC 0.30 against correctness, versus 0.77 for confidence." },
  { title: "Option order matters at 20 options", body: "Answers change under shuffling 15% (laya) and 23% (multilingual) of the time on MASSIVE intent, against 13% measured for Jev." },
  { title: "Long documents", body: "At max_len 8,192, 16–18 of 20 correct up to ~4,000 tokens, 8–17 of 20 beyond; predict_long probabilities are per window, not per document." },
];

export default function Evaluation() {
  const td = TYPED_DECISIONS;
  return (
    <>
      <Lead>
        A decision engine is worth exactly as much as its measured performance on your decisions. This chapter defines
        the metrics, shows how to gate a build on them, lays out Laya's published numbers with their context, and
        collects the limits in one place.
      </Lead>

      <h2>Metrics that matter</h2>
      <TableWrap caption="Definitions follow the fine-tuning notebook's evaluation cell and laya/evals.py. p is the model's distribution, t the target (one-hot label or teacher distribution).">
        <table>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Definition</th>
              <th scope="col">Tells you</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Accuracy</td>
              <td>argmax matches the label (score: argmax level; noul: P(true) ≥ 0.5)</td>
              <td>How often the answer is right</td>
            </tr>
            <tr>
              <td>Soft accuracy</td>
              <td>
                <M>{String.raw`\sum_i p_i\, t_i`}</M>, averaged
              </td>
              <td>Expected agreement with a teacher's distribution</td>
            </tr>
            <tr>
              <td>Brier score</td>
              <td>
                <M>{String.raw`\sum_i (p_i - t_i)^2`}</M>, averaged (lower is better)
              </td>
              <td>Accuracy and calibration of the whole distribution</td>
            </tr>
            <tr>
              <td>ECE</td>
              <td>15-bin gap between confidence (max p) and accuracy (chapter 10)</td>
              <td>Whether confidence can be taken at face value</td>
            </tr>
            <tr>
              <td>Score MAE, within one level</td>
              <td>|expected level − gold level|, and the share within 1</td>
              <td>How far off ordinal answers are</td>
            </tr>
            <tr>
              <td>AUROC of confidence</td>
              <td>Probability that a correct answer outranks a wrong one by confidence</td>
              <td>Whether confidence separates right from wrong (for gating)</td>
            </tr>
            <tr>
              <td>Accuracy at coverage</td>
              <td>Accuracy of the answers kept above a threshold, and the share kept</td>
              <td>What automation will look like (chapter 13)</td>
            </tr>
            <tr>
              <td>Option-order flip rate</td>
              <td>How often the answer changes when options are shuffled</td>
              <td>Sensitivity to presentation</td>
            </tr>
            <tr>
              <td>Latency p50 / p95</td>
              <td>Per call, including tokenisation, on your hardware</td>
              <td>Whether it fits the budget</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>

      <h2>Gate builds on an evaluation set</h2>
      <p>
        <code>laya-evals</code> scores a JSONL dataset and exits non-zero when a threshold or a baseline tolerance fails,
        so a quality change becomes a reviewable diff. The metric code is pure Python and NumPy; only running the
        dataset needs a checkpoint. It can also score an ONNX export, including an INT8 copy, against the same gates.{" "}
        <Source path="laya/evals.py" />
      </p>
      <CodeBlock lang="json" code={ROW} title="Dataset format" />
      <CodeBlock lang="bash" code={EVALS} title="Shell · laya-evals" />

      <h2>What the published numbers show</h2>
      <Callout type="note" title="Reading these numbers">
        Laya's figures were measured in the repository's own runs with byte-identical questions for every checkpoint. Jev
        figures are third-party published results, never measured by the Laya project; sample sizes and prompts differ,
        so treat those comparisons as indicative, not controlled.
      </Callout>

      <Figure
        title="typed-decisions: 400 cases, 2,000 decisions"
        kind="data"
        caption={
          <>
            Accuracy by model (README and BENCHMARKS.md), against the teacher's self-agreement ceiling ({td.teacherCeiling}), the
            per-question majority class ({td.majorityClass}) and random guessing ({td.random}). Only the fine-tuned checkpoint was
            trained on this benchmark's training split. By workflow, the fine-tuned model scores 0.804 (invoices), 0.766
            (security), 0.764 (customer service) and 0.730 (agent traces); by primitive, noul 0.857, choice 0.733, score 0.723.
          </>
        }
      >
        <BarChart
          ariaLabel="typed-decisions accuracy by model"
          valueLabel="Model"
          domain={[0, 1]}
          series={[{ id: "acc", label: "accuracy", color: "var(--viz-choice)" }]}
          rows={td.models.map((m) => ({ label: m.model, values: { acc: m.accuracy }, note: `Brier ${m.brier}, ECE ${m.ece}, soft acc ${m.softAcc}` }))}
          refLines={[
            { value: td.teacherCeiling, label: "teacher ceiling" },
            { value: td.majorityClass, label: "majority class" },
            { value: td.random, label: "random" },
          ]}
          labelWidth={190}
        />
      </Figure>

      <Figure title="Application workflows, 400 real labelled cases each" kind="data" caption="BENCHMARKS.md “Themes”. “Held out” means the source was not in Laya's training mix; the others were, which flatters them.">
        <BarChart
          ariaLabel="Accuracy of the three checkpoints on seven application workflows"
          valueLabel="Workflow"
          domain={[0, 1]}
          series={[
            { id: "laya", label: "laya", color: "var(--viz-choice)" },
            { id: "multilingual", label: "laya-multilingual", color: "var(--viz-accent)" },
            { id: "typed", label: "laya-typed-decisions", color: "var(--viz-noul)" },
          ]}
          rows={THEMES.map((t) => ({
            label: `${t.theme}${t.heldOut ? " (held out)" : ""}`,
            values: { laya: t.laya, multilingual: t.multilingual, typed: t.typed },
          }))}
          labelWidth={250}
        />
      </Figure>

      <Figure title="Public datasets with published Jev numbers" kind="data" caption="BENCHMARKS.md. Jev's Banking77 figure is on 72 labels, Laya's on 77. Jev figures are third-party published.">
        <BarChart
          ariaLabel="Accuracy on AG News, DAIR Emotion and Banking77"
          valueLabel="Dataset"
          domain={[0, 1]}
          series={[
            { id: "laya", label: "laya", color: "var(--viz-choice)" },
            { id: "multilingual", label: "laya-multilingual", color: "var(--viz-accent)" },
            { id: "typed", label: "laya-typed-decisions", color: "var(--viz-noul)" },
            { id: "jev", label: "Jev (published)", color: "var(--viz-neutral)" },
          ]}
          rows={PUBLIC_DATASETS.map((d) => ({ label: d.dataset, values: { laya: d.laya, multilingual: d.multilingual, typed: d.typed, jev: d.jev } }))}
          labelWidth={190}
        />
      </Figure>

      <h3>Speed</h3>
      <TableWrap caption="Milliseconds per call. T4: README (measured). CPU: BENCHMARKS.md, AMD EPYC 9R14 with 4 cores, fp32, p50. Third-party measurements put Jev at 236–276 ms p50 for one question.">
        <table>
          <thead>
            <tr>
              <th scope="col">Questions per call</th>
              <th scope="col" className="num">
                laya, T4
              </th>
              <th scope="col" className="num">
                multilingual, T4
              </th>
              <th scope="col" className="num">
                english, CPU
              </th>
              <th scope="col" className="num">
                multilingual, CPU
              </th>
            </tr>
          </thead>
          <tbody>
            {([1, 5, 10, 50] as const).map((n) => (
              <tr key={n}>
                <td>{n}</td>
                <td className="num">{T4_LATENCY_MS.laya[n]}</td>
                <td className="num">{T4_LATENCY_MS["laya-multilingual"][n]}</td>
                <td className="num">{CPU_LATENCY_MS.english[n].toLocaleString()}</td>
                <td className="num">{CPU_LATENCY_MS.multilingual[n].toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <h2>The limits, stated plainly</h2>
      <p>
        Laya's documentation is unusually candid about where it falls short. Every item below is from its README or
        benchmark report; each is also a checklist item for your own evaluation.
      </p>
      <div className="limits">
        {LIMITS.map((l) => (
          <div key={l.title} className="limit">
            <div className="limit-title">{l.title}</div>
            <div className="limit-body">{l.body}</div>
          </div>
        ))}
      </div>
      <Callout type="warning" title="Community diagnostics point the same way">
        A community diagnostic of 64 synthetic Chinese workplace scenarios (ownership, cancellation, urgency, quoted
        instructions and more) recorded the multilingual checkpoint, zero-shot and without threshold fitting, matching
        20 of 64 reference labels on the choice form, against 64 of 64 for Jev. Its authors present it as a diagnostic,
        not a ranking; it is a clear reminder to evaluate on your own decisions, in your own language, before relying
        on a base checkpoint.
      </Callout>

      <h2>Evaluating for your own use</h2>
      <ol>
        <li>Sample real traffic and label it (or collect a teacher's distributions), keeping a held-out test set.</li>
        <li>Include the hard cases: negations, other languages, near-duplicate labels, long inputs, the “other” bucket.</li>
        <li>Report accuracy with baselines (random, majority class, your incumbent) and with calibration (ECE, Brier).</li>
        <li>Measure accuracy at the coverage you plan to automate, per slice (language, checkpoint, schema).</li>
        <li>Check option-order sensitivity and latency on your hardware and precision.</li>
        <li>Gate every model, schema or threshold change on the same set in CI.</li>
      </ol>

      <KeyTakeaways
        items={[
          "Measure accuracy with baselines, calibration (ECE, Brier) and accuracy at coverage, not accuracy alone.",
          "laya-evals turns a labelled JSONL set into a CI gate with thresholds, slices and baselines.",
          "Fine-tuned, Laya beats the published Jev figure on typed-decisions (0.766 vs 0.727); base checkpoints are near chance there.",
          "Strong as shipped on spam and phishing; weak on held-out moderation and on large label sets.",
          "Read every published number with its context, and trust only what you measure on your own decisions.",
        ]}
      />
    </>
  );
}
