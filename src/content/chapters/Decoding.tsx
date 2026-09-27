import { Callout } from "../../components/ui/Callout";
import { CodeBlock } from "../../components/ui/CodeBlock";
import { KeyTakeaways, Lead, Source, TableWrap } from "../../components/ui/Blocks";
import { M, MathBlock } from "../../components/ui/Math";
import { DecodingPlayground } from "../../figures/DecodingPlayground";

const GATE = `res = agent.predict(state, questions, min_confidence=0.85)
ans = res["answers"]["department"]

if ans.get("low_confidence"):            # answer_confidence < 0.85
    escalate_to_human_agent(ans["choice"], reason=f"Low confidence ({ans['answer_confidence']:.2f})")
else:
    route_automatically(ans["choice"])`;

export default function Decoding() {
  return (
    <>
      <Lead>
        The forward pass ends with one raw number per option. Everything a caller sees (the chosen label, the
        probabilities, the confidence) is computed from those logits in a few lines of decoding. Small as it is,
        this is where calibration is applied and where the most common gating mistake is made.
      </Lead>

      <h2>Temperature, then softmax</h2>
      <p>For a question with <M>{"k"}</M> options and logits <M>{"z_1,\\dots,z_k"}</M>, Laya computes</p>
      <MathBlock>{String.raw`p_i \;=\; \frac{e^{z_i / T}}{\sum_{j=1}^{k} e^{z_j / T}}`}</MathBlock>
      <p>
        where <M>{"T"}</M> is a temperature stored in the checkpoint's config. Dividing every logit by the same
        positive number never changes which one is largest, so <strong>temperature changes confidence, never the
        answer</strong>. <M>{"T > 1"}</M> spreads the probability out; <M>{"T < 1"}</M> concentrates it.
      </p>
      <p>Which temperature applies depends on the question:</p>
      <ol>
        <li>
          If a language code is given and the agent was loaded with <code>lang_temperatures</code> for it, that
          language's values are used.
        </li>
        <li>
          Otherwise, a temperature fitted for the <em>bucket</em> (question type × option count) wins if one exists:{" "}
          <code>choice:2</code>, <code>choice:3-5</code>, <code>choice:6-10</code>, <code>choice:11+</code>, and the
          same for <code>score</code> and <code>noul</code>.
        </li>
        <li>Otherwise, the per-type temperature (one each for choice, score, noul).</li>
      </ol>
      <Callout type="laya" title="The clamp: a safety net, not a calibration">
        At load time every temperature is clamped to [0.5, 5], and anything that is not a finite number falls back
        to 1.0, with a warning naming the affected entries. The source explains why: the shipped{" "}
        <code>choice:11+</code> bucket held 0.1006, which multiplies the logits about ten times, so “a 0.24 top
        probability is published as 0.99”. Load the <em>Over-sharpened bucket</em> example below and switch the
        clamp on and off to see exactly that. <Source path="laya/common.py">clamp_temperature</Source>
      </Callout>

      <h2>Reading off the answer</h2>
      <TableWrap>
        <table>
          <thead>
            <tr>
              <th scope="col">Type</th>
              <th scope="col">Answer field</th>
              <th scope="col">
                <code>confidence</code>
              </th>
              <th scope="col">
                <code>answer_confidence</code>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>choice</td>
              <td>the label with the largest pᵢ</td>
              <td>1 − H(p)/log k</td>
              <td>max(p)</td>
            </tr>
            <tr>
              <td>score</td>
              <td>Σ i·pᵢ, the expected level</td>
              <td>1 − H(p)/log k</td>
              <td>max(p)</td>
            </tr>
            <tr>
              <td>noul</td>
              <td>p₁ = P(true)</td>
              <td>max(p₁, 1 − p₁)</td>
              <td>max(p) (the same number)</td>
            </tr>
          </tbody>
        </table>
      </TableWrap>

      <DecodingPlayground />

      <h2>Two confidences, and which one to use</h2>
      <p>For choice and score questions Laya reports two different numbers, for historical reasons:</p>
      <ul>
        <li>
          <strong>
            <code>confidence</code>
          </strong>{" "}
          is one minus the normalised entropy,{" "}
          <M>{String.raw`1 - \tfrac{H(p)}{\log k}`}</M> with <M>{String.raw`H(p) = -\sum_i p_i \log p_i`}</M>. It
          measures how concentrated the whole distribution is: 1 for a certain answer, 0 for a uniform one. It is
          useful as a description, but it is <em>not</em> what temperature scaling fits, and no calibration figure is
          computed on it.
        </li>
        <li>
          <strong>
            <code>answer_confidence</code>
          </strong>{" "}
          is <M>{"\\max_i p_i"}</M>, the probability the model assigns to the answer it reports. This is the quantity
          the temperatures are fitted on and the quantity expected calibration error is measured on, so it is the one
          with the property you want: among answers given at confidence 0.8, about 80% should be right (once
          temperatures are fitted on your data, chapter 10).
        </li>
      </ul>
      <p>
        The two can disagree. With probabilities (0.6, 0.4, 0, 0) and (0.6, 0.13, 0.13, 0.14), the answer
        confidence is 0.6 in both cases, but the entropy confidence is higher for the first, because its leftover
        mass is concentrated on one rival.
      </p>
      <Callout type="warning" title="Thresholds do not transfer">
        Always gate on <code>answer_confidence</code>. Laya's own <code>min_confidence</code> and the LangChain
        router's <code>confidence_threshold</code> read it. And a threshold tuned for another system does not carry
        over: Jev's confidence is defined as <M>{String.raw`(n\,p_{\max} - 1)/(n - 1)`}</M>, a third, different
        quantity.
      </Callout>

      <h2>Opt-in abstention</h2>
      <p>
        Passing <code>min_confidence</code> to <code>predict</code>, <code>predict_batch</code> or <code>decide</code>{" "}
        leaves every answer intact and adds <code>low_confidence: true</code> to each answer whose{" "}
        <code>answer_confidence</code> falls below the threshold. With <code>decide</code>, such a field comes back
        as <code>None</code> in the schema-shaped output. Nothing changes when it is left unset.{" "}
        <Source path="laya/confidence.py" />
      </p>
      <CodeBlock code={GATE} title="Python · confidence gating (README)" />
      <p>
        The threshold itself is a policy you choose from measured accuracy at the coverage you need, on your own
        data, in the precision (fp32, bf16, fp16) you serve. Chapter 13 shows how to choose it.
      </p>

      <KeyTakeaways
        items={[
          "p = softmax(z / T); the temperature comes from a language override, else a (type, option-count) bucket, else the per-type value.",
          "Temperature never changes the answer, only the confidence. Laya clamps temperatures to [0.5, 5] at load time.",
          "choice → argmax label; score → expected level Σ i·pᵢ; noul → P(true).",
          "Gate on answer_confidence = max(p), the calibrated number; the entropy-based confidence is descriptive only.",
          "min_confidence flags low-confidence answers without altering them; decide() returns None for them.",
        ]}
      />
    </>
  );
}
