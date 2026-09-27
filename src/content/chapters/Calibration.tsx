import { BarChart } from "../../components/charts/BarChart";
import { Callout } from "../../components/ui/Callout";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { Figure } from "../../components/ui/Figure";
import { KeyTakeaways, Lead, StatGrid, TableWrap } from "../../components/ui/Blocks";
import { M, MathBlock } from "../../components/ui/Math";
import { CALIBRATION_ECE } from "../../data/laya";
import { CalibrationLab } from "../../figures/CalibrationLab";

const FIT = `def fit_one_temp(sel):                     # sel: [(logits, target), ...] for one question type
    if len(sel) < 10:
        return 1.0
    ...
    log_t = torch.zeros(1, requires_grad=True)
    opt = torch.optim.LBFGS([log_t], lr=0.1, max_iter=100)
    def closure():
        opt.zero_grad()
        loss = -(T * torch.log_softmax(Z / log_t.exp(), -1)).sum(-1).mean()
        loss.backward()
        return loss
    opt.step(closure)
    return float(torch.clamp(log_t.exp(), 0.1, 10.0).item())`;

const LANG = `agent = laya.load(
    "convaiinnovations/laya", subfolder="multilingual",
    lang_temperatures={"zh": {"temperature": [1.3, 1.2, 5.0]}},   # choice, score, noul
)
agent.predict(state, questions, lang="zh")`;

export default function Calibration() {
  return (
    <>
      <Lead>
        A model is <strong>calibrated</strong> when its confidence can be taken at face value: of all the answers it
        gives with confidence 0.8, about 80% are right. Calibration is what makes a threshold like “automate above
        0.9” mean something. It is measured, not assumed, and for Laya it is fixed after training with a single
        number per question type.
      </Lead>

      <h2>Measuring it</h2>
      <p>
        Sort the answers into bins by confidence, and compare each bin's average confidence with its accuracy. Plotting
        one against the other gives a <em>reliability diagram</em>; a calibrated model lies on the diagonal. The{" "}
        <em>expected calibration error</em> summarises the gaps, weighting each bin by its share of the answers:
      </p>
      <MathBlock label="ECE">{String.raw`\mathrm{ECE} \;=\; \sum_{b=1}^{B} \frac{n_b}{N}\,\Big|\,\mathrm{acc}(b) - \mathrm{conf}(b)\,\Big|`}</MathBlock>
      <p>
        Laya's <code>ece_score</code> uses <M>{"B = 15"}</M> equal-width bins, and every calibration figure in the
        repository computes it on <M>{"\\max(p)"}</M>, the <code>answer_confidence</code> of chapter 7. ECE is not the
        only lens: the Brier score and negative log-likelihood reward both calibration and sharpness, and are reported
        alongside it.
      </p>

      <h2>Temperature scaling</h2>
      <p>
        The standard fix for a miscalibrated classifier is temperature scaling (Guo et al., 2017): divide all logits by
        one number <M>{"T"}</M>, chosen to minimise the cross-entropy on held-out data.
      </p>
      <MathBlock>{String.raw`T^\star \;=\; \arg\min_{T > 0}\; -\frac{1}{N}\sum_{n=1}^{N} \sum_i t_{n,i}\,\log \mathrm{softmax}\!\left(\frac{z_n}{T}\right)_{\!i}`}</MathBlock>
      <p>
        One parameter cannot overfit much, and because it rescales every logit equally, it cannot change a single
        answer: accuracy is untouched. What moves is the confidence. A model that is too sure of itself gets{" "}
        <M>{"T > 1"}</M>; one that is too timid gets <M>{"T < 1"}</M>.
      </p>

      <CalibrationLab />

      <h2>How Laya fits and stores temperatures</h2>
      <ol>
        <li>
          <strong>Hold out before training.</strong> The notebook withholds a calibration slice (up to 400 items or
          10%, fixed seed, identical on every GPU) before any training. The docs explain why: fitted on items the model
          has already trained on, the temperature “measures the fit rather than the calibration”.
        </li>
        <li>
          <strong>Fit one temperature per type.</strong> After the last epoch, LBFGS on <M>{"\\log T"}</M> fits one
          value each for choice, score and noul, clamped to [0.1, 10]; fewer than ten items give 1.0, and a failed fit
          falls back to 1.2.
        </li>
        <li>
          <strong>Write it into the config.</strong> The values go into <code>rl_agent_config.json</code> as{" "}
          <code>temperature</code>, and any inherited per-bucket <code>temperature_by_options</code> is deleted, since
          it would take precedence and silently undo the new fit.
        </li>
        <li>
          <strong>Clamp at load time.</strong> The runtime then clamps every temperature to [0.5, 5] (chapter 7).
        </li>
      </ol>
      <CodeBlock code={FIT} title="Python · fit_one_temp in the fine-tuning notebook (abridged)" />

      <h2>What the published numbers say</h2>
      <Figure title="Mean ECE before and after refitting temperatures" kind="data" caption="From the README's “Calibration” section: one temperature per (question type, option count), refitted on held-out data. Lower is better.">
        <BarChart
          ariaLabel="ECE as shipped and after temperature refit, for laya and laya-multilingual"
          valueLabel="Checkpoint"
          domain={[0, 0.5]}
          series={[
            { id: "shipped", label: "as shipped", color: "var(--viz-s2)" },
            { id: "refit", label: "after refit", color: "var(--viz-accent)" },
          ]}
          rows={CALIBRATION_ECE.map((c) => ({ label: c.model, values: { shipped: c.shipped, refit: c.refit } }))}
          labelWidth={140}
        />
      </Figure>
      <ul>
        <li>
          <strong>Both checkpoints ship over-confident</strong>, and <code>laya-multilingual</code> ships with no fitted
          temperatures at all. Refitting takes mean ECE from 0.466 to 0.081 (English) and 0.314 to 0.106
          (multilingual). The benchmark report calls this “the single highest-value fix available”.
        </li>
        <li>
          <strong>The direction depends on the task.</strong> On one zero-shot routing task (180 requests, a 3-tier
          choice), the checkpoints were <em>under</em>-confident: mean P(chosen) 0.562 against accuracy 0.744.
        </li>
        <li>
          <strong>Small calibration sets are noisy.</strong> A community refit for Chinese on 284 questions, split
          50/50, made held-out ECE worse in three of four buckets (for example 0.062 → 0.093 for{" "}
          <code>choice:6-10</code>) and much better for <code>noul:2</code> (0.180 → 0.098), whose raw fit of 10.2
          exceeded the runtime clamp.
        </li>
      </ul>

      <Callout type="warning" title="Calibration cannot rescue an input the model cannot read">
        <p>
          Calibration is a property of the data you measured it on. On the 51-language sweep, the English checkpoint
          answered Khmer with <strong>0.000 accuracy at 0.952 confidence</strong>, and its mean confidence never
          dropped below 0.885 at any accuracy level. No threshold can catch that, because the model gives no signal
          that anything is wrong. The fix has to come <em>before</em> the forward pass: send the text to a checkpoint
          that can read it. That is the router, next chapter.
        </p>
      </Callout>

      <StatGrid
        items={[
          { value: "0.000", label: "accuracy on Khmer", note: "English checkpoint, 20-option intent", tone: "s2" },
          { value: "0.952", label: "its mean confidence", note: "the model gives no warning", tone: "s2" },
          { value: "0.733", label: "macro ECE, 51 languages", note: "English checkpoint (0.387 multilingual)", tone: "neutral" },
        ]}
      />

      <h2>Per-language and per-precision calibration</h2>
      <p>
        If one language behaves differently, an agent can be given its own temperatures with{" "}
        <code>lang_temperatures</code>; they apply when the call passes a matching <code>lang</code>. The values below
        are placeholders; fit your own.
      </p>
      <CodeBlock code={LANG} title="Python · per-language temperatures" />
      <p>
        Precision matters too. On a fixed test set, bf16 autocast moved probabilities by up to 0.073 against fp32 and
        flipped 3 of 864 answers across the three checkpoints; fp16 stayed within 0.019 and flipped none. The README's
        rule: fit and measure a threshold in the precision you serve with.
      </p>
      <TableWrap caption="From the README's “Automated Confidence Gating” section (60 states, 288 questions per checkpoint, RTX 2000 Ada).">
        <table>
          <thead>
            <tr>
              <th scope="col">Autocast dtype</th>
              <th scope="col" className="num">
                max |Δp| vs fp32
              </th>
              <th scope="col" className="num">
                argmax flips (of 864)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>bf16 (default on newer GPUs)</td>
              <td className="num">0.073</td>
              <td className="num">3</td>
            </tr>
            <tr>
              <td>fp16 (LAYA_CUDA_AMP=fp16)</td>
              <td className="num">0.019</td>
              <td className="num">0</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>

      <KeyTakeaways
        items={[
          "Calibrated means: of the answers given at confidence c, a fraction of about c is right. ECE measures the gap with 15 bins on max(p).",
          "Temperature scaling fits one number on held-out data; it changes confidence, never accuracy.",
          "Laya holds out a calibration slice before training, fits one T per question type, and clamps at load time.",
          "Shipped checkpoints are over-confident (ECE 0.466 → 0.081 after refit), but direction and size depend on the task: fit on your own data.",
          "No calibration fixes inputs the model cannot read: route them away before the forward pass.",
        ]}
      />
    </>
  );
}
