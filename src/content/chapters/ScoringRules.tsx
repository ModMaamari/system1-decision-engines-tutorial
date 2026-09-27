import { Callout } from "../../components/ui/Callout";
import { KeyTakeaways, Lead, Source, TableWrap } from "../../components/ui/Blocks";
import { M, MathBlock } from "../../components/ui/Math";
import { OrdinalScores, ScoringExplorer } from "../../figures/ScoringExplorer";

export default function ScoringRules() {
  return (
    <>
      <Lead>
        A decision engine is only useful for automation if its probabilities mean something: when it says 0.9, it
        should be right about nine times in ten. That property has to be trained in. The tool for it is a{" "}
        <strong>strictly proper scoring rule</strong>, and it is the idea behind Laya's training method, RLCD.
      </Lead>

      <h2>Rewarding a forecast</h2>
      <p>
        A <em>scoring rule</em> <M>{"S(q, y)"}</M> gives a reward for reporting the distribution <M>{"q"}</M> when
        outcome <M>{"y"}</M> happens. If outcomes really follow a distribution <M>{"p"}</M>, the forecaster's expected
        reward is
      </p>
      <MathBlock>{String.raw`\mathbb{E}_{y \sim p}\big[S(q, y)\big] \;=\; \sum_{y} p_y \, S(q, y).`}</MathBlock>
      <p>
        The rule is <strong>proper</strong> if this expectation is maximised by reporting <M>{"q = p"}</M>, and{" "}
        <strong>strictly proper</strong> if <M>{"q = p"}</M> is the only maximiser (Gneiting and Raftery, 2007). Under
        a strictly proper rule, the best strategy is to say exactly what you believe: overclaiming and hedging both
        cost reward. A model trained to maximise such a reward is pushed towards honest probabilities.
      </p>

      <h2>The rules that matter here</h2>
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th scope="col">Rule</th>
              <th scope="col">Reward for outcome y</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Logarithmic</td>
              <td>
                <M>{String.raw`\log q_y`}</M>
              </td>
              <td>Strictly proper. Its negative is cross-entropy. Unbounded below, so Laya floors it at −9.21 (about log 10⁻⁴).</td>
            </tr>
            <tr>
              <td>Spherical</td>
              <td>
                <M>{String.raw`q_y / \lVert q \rVert_2`}</M>
              </td>
              <td>Strictly proper and bounded between 0 and 1, so it gives stable gradients.</td>
            </tr>
            <tr>
              <td>Brier (negated)</td>
              <td>
                <M>{String.raw`-\sum_i (q_i - \mathbb{1}[i = y])^2`}</M>
              </td>
              <td>Strictly proper and bounded. Laya reports Brier as an evaluation metric.</td>
            </tr>
            <tr>
              <td>Ranked probability (penalty)</td>
              <td>
                <M>{String.raw`\frac{1}{k-1}\sum_{i}\big(F_q(i) - F_y(i)\big)^2`}</M>
              </td>
              <td>For ordered outcomes; F is the cumulative distribution. Strictly proper, and it charges more for a far miss.</td>
            </tr>
            <tr>
              <td>Linear</td>
              <td>
                <M>{"q_y"}</M>
              </td>
              <td>
                <strong>Not proper.</strong> Its expectation is linear in <M>{"q"}</M>, so it is maximised at an extreme.
              </td>
            </tr>
            <tr>
              <td>Accuracy</td>
              <td>
                <M>{String.raw`\mathbb{1}[\arg\max q = y]`}</M>
              </td>
              <td>
                <strong>Not strictly proper.</strong> It ignores the probabilities, so it cannot tell 0.51 from 0.99.
              </td>
            </tr>
          </tbody>
        </table>
      </TableWrap>

      <ScoringExplorer />

      <p>
        The explorer makes the point concrete. With <M>{"p = 0.7"}</M>, the log, spherical and Brier curves all peak
        at <M>{"q = 0.7"}</M>. The linear score keeps rising to the edge: it pays for overconfidence. Accuracy gives
        the same reward for 0.51 and 0.99, so nothing in it stops training from pushing probabilities to the
        extremes. The article that introduced Laya puts it this way: naive RL with a correct/incorrect reward can
        maximise accuracy while destroying calibration.
      </p>

      <h2>Ordered answers need an ordered penalty</h2>
      <p>
        For a <code>score</code> question the levels are ordered, and a forecast of “serious” when the truth is
        “severe” is better than a forecast of “none”. The log score cannot see this; it only reads the probability on
        the true level. The ranked probability score compares the cumulative distributions, so the error grows with
        the distance.
      </p>
      <OrdinalScores />

      <h2>Laya's composite reward</h2>
      <p>
        Laya combines these into one reward, computed against a <em>target distribution</em> <M>{"t"}</M>, which may
        be one-hot (a labelled answer) or soft (a teacher's probabilities):
      </p>
      <MathBlock label="proper_reward">{String.raw`R(q, t) \;=\; \sum_i t_i \max(\log q_i,\, -9.21) \;+\; w_{\text{sph}} \,\frac{\sum_i t_i\, q_i}{\lVert q \rVert_2} \;-\; w_{\text{rps}}\;\mathbb{1}[\text{score}]\;\mathrm{RPS}(q, t)`}</MathBlock>
      <p>
        The library defaults are <M>{String.raw`w_{\text{sph}} = 0.5`}</M> and <M>{String.raw`w_{\text{rps}} = 1`}</M>;
        the public fine-tuning notebook uses <M>{String.raw`w_{\text{sph}} = 0.75`}</M>. The RPS term applies only to{" "}
        <code>score</code> questions. <Source path="laya/common.py">proper_reward</Source>
      </p>
      <ul>
        <li>
          <strong>A sum of proper rules is proper.</strong> Each term's expectation is maximised at the same point, so
          their positively weighted sum is too, and strictly so because the log score is strict.
        </li>
        <li>
          <strong>With a soft target, the optimum is the target.</strong> <M>{String.raw`\sum_i t_i \log q_i`}</M> is
          largest when <M>{"q = t"}</M> (Gibbs' inequality). Training therefore imitates the teacher's whole
          distribution, uncertainty included, not just its top answer.
        </li>
        <li>
          <strong>One honest caveat.</strong> The floor at −9.21 caps the penalty for probabilities below about 10⁻⁴,
          so below that point the log term stops telling reports apart. It keeps the reward bounded, at the cost of
          exact propriety in that corner.
        </li>
      </ul>

      <Callout type="note" title="Proper does not mean calibrated">
        A proper reward makes honest probabilities the optimum; it does not guarantee that a finite training run
        reaches it, or that it holds on data unlike the training set. Laya's shipped checkpoints are measurably
        over-confident (chapter 10). That is why training is followed by temperature fitting on held-out data, and
        why calibration is always measured, never assumed.
      </Callout>

      <KeyTakeaways
        items={[
          "A strictly proper scoring rule is maximised in expectation only by reporting your true belief.",
          "Log, spherical and Brier scores are strictly proper; the linear score and plain accuracy are not.",
          "For ordered answers, the ranked probability score also rewards being close.",
          "Laya's reward is log score + w_sph · spherical − w_rps · RPS (score questions only), against one-hot or soft targets.",
          "Proper rewards make honesty the optimum; calibration still has to be measured and usually refitted.",
        ]}
      />
    </>
  );
}
